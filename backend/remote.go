package main

import (
	"os"
	"os/exec"
	"path/filepath"
)

func repositoryExist(name, dir string) bool {
	_, err := os.Stat(filepath.Join(dir, name))
	return err == nil
}

func cloneRepository(path, dir string) error {
	cmd := exec.Command("git", "clone", path)
	cmd.Dir = dir
	return cmd.Run()
}
