package main

import (
	"bufio"
	"errors"
	"fmt"
	"math"
	"os"
	"os/exec"
	"strconv"
	"strings"
	"time"
)

type Response struct {
	StartDate float64        `json:"startDate"`
	Updates   []GitOperation `json:"updates"`
}

type GitOperation struct {
	Dir       []string           `json:"dir"`
	Duration  float64            `json:"duration"`
	Name      string             `json:"name"`
	StartDate float64            `json:"startDate"`
	StartTime time.Time          `json:"-"`
	Updates   []GitOperationFile `json:"updates"`
}

type GitOperationFile struct {
	Action int      `json:"action"`
	File   []string `json:"file"`
}

func (operation *GitOperation) calcOperationDir() {
	i := 0
	for {
		candidate := ""
		for _, u := range operation.Updates {
			if len(u.File)-1 < i+1 {
				break
			}
			if candidate == "" {
				candidate = u.File[i]
			}
			if candidate != "" && candidate != u.File[i] {
				candidate = ""
				break
			}
		}
		if candidate == "" {
			break
		}
		operation.Dir = append(operation.Dir, candidate)
		i++
	}
}

func calcOperationsDuration(operations []GitOperation, dayDuration, maxCommitDuration float64) {
	maxCommits := int(math.Ceil(dayDuration / maxCommitDuration))
	i, j, date := 0, 0, 0.0
	for i < len(operations) {
		operations[i].StartDate = date
		for j = i; j < len(operations) &&
			operations[j].StartTime.Year() == operations[i].StartTime.Year() &&
			operations[i].StartTime.YearDay() == operations[j].StartTime.YearDay(); j++ {
		}
		if j-i > maxCommits {
			singleDuration := dayDuration / float64(j-i)
			operations[i].Duration = singleDuration
			for k := i + 1; k < j; k++ {
				operations[k].StartDate, operations[k].Duration = operations[k-1].StartDate+singleDuration, singleDuration
			}
		} else {
			pauseTotalDuration := dayDuration - float64(j-i)*maxCommitDuration
			singlePause := pauseTotalDuration / float64(j-i)
			operations[i].StartDate += singlePause
			operations[i].Duration = maxCommitDuration
			for k := i + 1; k < j; k++ {
				operations[k].StartDate, operations[k].Duration = operations[k-1].StartDate +
					operations[k-1].Duration + singlePause, maxCommitDuration
			}
		}
		if j < len(operations) {
			first, second := operations[j-1].StartTime, operations[j].StartTime
			first = time.Date(first.Year(), first.Month(), first.Day(), 0, 0, 0, 0, first.Location())
			second = time.Date(second.Year(), second.Month(), second.Day(), 0, 0, 0, 0, second.Location())
			//log.Println(first, second)
			date += dayDuration * second.Sub(first).Hours() / 24
			//log.Println(date)
		}
		i = j
	}
}

func readLocalRepository(path string, dayDuration, maxCommitDuration int64) (res *Response, err error) {
	cmd := exec.Command("git", "log", "--name-status", "--first-parent", "-m", "--reverse", "--date=unix")
	cmd.Dir = path
	reader, err := cmd.StdoutPipe()
	if err != nil {
		return nil, errors.New(fmt.Sprintf("git log stdout pipe err: %v", err))
	}
	cmd.Stderr = os.Stderr
	if err := cmd.Start(); err != nil {
		return nil, errors.New(fmt.Sprintf("start git log err: %v", err))
	}
	defer reader.Close()
	scanner := bufio.NewScanner(reader)
	res = new(Response)
	for {
		if scanner.Scan() {
			line := scanner.Text()
			if scanner.Err() != nil {
				return nil, errors.New(fmt.Sprintf("git log read commit line err: %v", scanner.Err()))
			}
			if strings.HasPrefix(line, "commit") {
				name, date, files, err := readAuthor(scanner)
				if err != nil {
					return nil, err
				}
				operation := GitOperation{
					Dir:       []string{},
					Duration:  0, // calc duration
					Name:      name,
					StartDate: float64(date), // calc
					StartTime: time.Unix(date, 0),
					Updates:   files,
				}
				if len(res.Updates) == 0 {
					t := operation.StartTime
					res.StartDate = float64(time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, t.Location()).Unix())*1000
				}
				// calc dir
				operation.calcOperationDir()
				res.Updates = append(res.Updates, operation)
			} else {
				return nil, errors.New(fmt.Sprintf("git log unexpected word. expected: commit. got: %s", line))
			}
		} else {
			break
		}
	}
	if err := cmd.Wait(); err != nil {
		return nil, errors.New(fmt.Sprintf("wait git log err: %v", err))
	}
	calcOperationsDuration(res.Updates, float64(dayDuration), float64(maxCommitDuration))
	return
}

func readAuthor(in *bufio.Scanner) (name string, date int64, files []GitOperationFile, err error) {
	if in.Scan() {
		line := in.Text()
		if in.Err() != nil {
			return "", 0, nil, errors.New(fmt.Sprintf("git log read author line err: %v", in.Err()))
		}
		if strings.HasPrefix(line, "Merge:") {
			return readAuthor(in)
		} else if strings.HasPrefix(line, "Author:") {
			name = strings.TrimLeft(line, "Author: ")
			date, files, err = readDate(in)
			return
		} else {
			return "", 0, nil, errors.New(fmt.Sprintf("git log unexpected word. expected: Merge or Author.got: %s", line))
		}
	} else {
		return "", 0, nil, errors.New("unexpected false scan(author)")
	}
}

func readDate(in *bufio.Scanner) (date int64, files []GitOperationFile, err error) {
	if in.Scan() {
		line := in.Text()
		if in.Err() != nil {
			return 0, nil, errors.New(fmt.Sprintf("git log read date line err: %v", in.Err()))
		}
		if strings.HasPrefix(line, "Date:") {
			date, err = strconv.ParseInt(strings.Replace(strings.TrimLeft(line, "Date:"), " ", "", -1), 10, 64)
			if err != nil {
				return 0, nil, errors.New(fmt.Sprintf("git log parse date err: %s %v", line, err))
			}
			files, err = readCommitName(in)
			return
		} else {
			return 0, nil, errors.New(fmt.Sprintf("git log unexpected word. expected: Date.got: %s", line))
		}
	} else {
		return 0, nil, errors.New("unexpected false scan(date)")
	}
}

func readCommitName(in *bufio.Scanner) (files []GitOperationFile, err error) {
	if in.Scan() {
		line := in.Text()
		if in.Err() != nil {
			return nil, errors.New(fmt.Sprintf("git log read commit name line err: %v", in.Err()))
		}
		if line == "" {
			return readCommitName(in)
		} else if line != "" {
			if in.Scan() {
				if in.Err() != nil {
					return nil, errors.New(fmt.Sprintf("git log read commit name2 line err: %v", in.Err()))
				}
				return readGitOperationFile(in)
			} else {
				return nil, errors.New("unexpected false scan(commit name2)")
			}
		}
	} else {
		return nil, errors.New("unexpected false scan(commit name)")
	}
	return
}

func readGitOperationFile(in *bufio.Scanner) (files []GitOperationFile, err error) {
	for in.Scan() {
		line := in.Text()
		if in.Err() != nil {
			return nil, errors.New(fmt.Sprintf("git log read commit file line err: %v", in.Err()))
		}
		if line == "" {
			break
		}
		splitted := strings.Split(line, "\t")
		if len(splitted) < 2 {
			return nil, errors.New(fmt.Sprintf("git file expected at least slice of 2 elements. got: %s %v", line, splitted))
		}
		if len(splitted[0]) == 0 {
			return nil, errors.New(fmt.Sprintf("git file expected not empty status. got: %s %v", line, splitted))
		}
		if splitted[0][0] == 'A' {
			if len(splitted[1]) == 0 {
				return nil, errors.New(fmt.Sprintf("git file expected not empty name. got: %s %v", line, splitted[1]))
			}
			files = append(files, GitOperationFile{Action: 0, File: strings.Split(splitted[1], "/")})
		} else if splitted[0][0] == 'D' {
			if len(splitted[1]) == 0 {
				return nil, errors.New(fmt.Sprintf("git file expected not empty name. got: %s %v", line, splitted[1]))
			}
			files = append(files, GitOperationFile{Action: 2, File: strings.Split(splitted[1], "/")})
		} else if splitted[0][0] == 'M' || splitted[0][0] == 'T' || splitted[0][0] == 'U' || splitted[0][0] == 'X' || splitted[0][0] == 'B' {
			if len(splitted[1]) == 0 {
				return nil, errors.New(fmt.Sprintf("git file expected not empty name. got: %s %v", line, splitted[1]))
			}
			files = append(files, GitOperationFile{Action: 1, File: strings.Split(splitted[1], "/")})
		} else if splitted[0][0] == 'C' {
			if len(splitted) != 3 {
				return nil, errors.New(fmt.Sprintf("git file expected slice of 3 elements. got: %s %v", line, splitted))
			}
			if len(splitted[1]) == 0 || len(splitted[2]) == 0 {
				return nil, errors.New(fmt.Sprintf("git file expected not empty names. got: %s %v %v", line, splitted[1], splitted[2]))
			}
			files = append(files, GitOperationFile{Action: 0, File: strings.Split(splitted[2], "/")})
		} else if splitted[0][0] == 'R' {
			if len(splitted) != 3 {
				return nil, errors.New(fmt.Sprintf("git file expected slice of 3 elements. got: %s %v", line, splitted))
			}
			if len(splitted[1]) == 0 || len(splitted[2]) == 0 {
				return nil, errors.New(fmt.Sprintf("git file expected not empty names. got: %s %v %v", line, splitted[1], splitted[2]))
			}
			files = append(files, GitOperationFile{Action: 2, File: strings.Split(splitted[1], "/")},
				GitOperationFile{Action: 0, File: strings.Split(splitted[2], "/")})
		}
	}
	if len(files) == 0 {
		return nil, errors.New("unexpected false scan(files)")
	}
	return
}
