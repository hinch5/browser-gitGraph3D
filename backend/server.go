package main

import (
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strconv"
)

type ErrorResponse struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

func writeResponse(w http.ResponseWriter, code int, toWrite []byte) {
	w.WriteHeader(code)
	if _, err := w.Write(toWrite); err != nil {
		log.Printf("write %d %s failed: %v\n", code, string(toWrite), err)
	}
}

func writeSuccess(w http.ResponseWriter, res interface{}) {
	send, err := json.Marshal(res)
	if err != nil {
		log.Printf("marshal success %v response failed: %v \n", res, err)
		writeResponse(w, 500, []byte{})
		return
	}
	writeResponse(w, 200, send)
}

func writeError(w http.ResponseWriter, code int, message string) {
	send, err := json.Marshal(&ErrorResponse{Code: code, Message: message})
	if err != nil {
		log.Printf("marshal error %d %s response failed: %v \n", code, message, err)
		writeResponse(w, 500, []byte{})
		return
	}
	writeResponse(w, code, send)
}

func validateString(values url.Values, name string, expected map[string]bool) (res string, err error) {
	if len(values[name]) == 0 {
		return "", errors.New(fmt.Sprintf("%s required", name))
	}
	res = values[name][0]
	if expected != nil {
		if !expected[res] {
			return "", errors.New(fmt.Sprintf("unexpected %s", name))
		}
	}
	return
}

func validateInt64(values url.Values, name string, min int64) (res int64, err error) {
	if len(values[name]) == 0 {
		return 0, errors.New(fmt.Sprintf("%s required", name))
	}
	res, err = strconv.ParseInt(values[name][0], 10, 64)
	if err != nil {
		return
	}
	if res < min {
		return 0, errors.New(fmt.Sprintf("unexpected %s", name))
	}
	return
}

func parseRepositoryHandler(local bool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			writeError(w, 405, "method is not allowed")
			return
		}
		if err := r.ParseForm(); err != nil {
			writeError(w, 400, "parse form err")
			log.Println("parse form failed: ", err)
			return
		}
		var (
			repoType string
			err      error
		)
		if local {
			repoType, err = validateString(r.PostForm, "repoType", map[string]bool{"local": true, "remote": true})
		} else {
			repoType, err = validateString(r.PostForm, "repoType", map[string]bool{"remote": true})
		}
		if err != nil {
			writeError(w, 400, err.Error())
			return
		}
		dayLength, err := validateInt64(r.PostForm, "dayLength", 100)
		if err != nil {
			writeError(w, 400, err.Error())
			return
		}
		maxCommitLength, err := validateInt64(r.PostForm, "maxCommitLength", 100)
		if err != nil {
			writeError(w, 400, err.Error())
			return
		}
		if repoType == "local" {
			path, err := validateString(r.PostForm, "path", nil)
			if err != nil {
				writeError(w, 400, "wrong path")
				return
			}
			res, err := readLocalRepository(path, dayLength, maxCommitLength)
			if err != nil {
				writeError(w, 500, "read repo failed")
				return
			}
			writeSuccess(w, res)
		} else if repoType == "remote" {
		
		}
	}
}

func main() {
	var (
		local bool
		port  int
	)
	flag.BoolVar(&local, "h", true, "is localhost")
	flag.IntVar(&port, "port", 8080, "server port")
	flag.Parse()
	if port <= 0 || port >= 65536 {
		log.Fatalf("wrong usage: %d port is invalid", port)
	}
	http.Handle("/api/repository", parseRepositoryHandler(local))
	log.Fatalln(http.ListenAndServe(fmt.Sprintf("localhost:%d", port), nil))
}
