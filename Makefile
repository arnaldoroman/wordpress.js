REPORTER?=progress
ifdef V
	REPORTER=spec
endif

ifdef TEST
	T=--grep '${TEST}'
	REPORTER=list
endif

dependencies:
	@npm install -s
	@npm prune -s

deps: dependencies

lint:
	@jshint lib

check:
	@./node_modules/mocha/bin/mocha \
		--reporter ${REPORTER} \
		-s 200 \
		-t 4000 $T \
		test/*

.PHONY: check dependencies lint
