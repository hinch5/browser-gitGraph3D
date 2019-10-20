package main

import (
	"flag"
	"log"
)

func main() {
	var (
		root  string
		local bool
		port  int
	)
	flag.StringVar(&root, "root", "", "root project directory")
	flag.BoolVar(&local, "h", true, "is localhost")
	flag.IntVar(&port, "port", 8080, "server port")
	flag.Parse()
	if port <= 0 || port >= 65536 {
		log.Fatalf("wrong usage: %d port is invalid", port)
	}
	
}
