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

check: check-config check-deps
	@./node_modules/mocha/bin/mocha \
		--reporter ${REPORTER} \
		-s 200 \
		-t 4000 $T \
		test/*.js; \

check-config:
	@if test ! -f test_config.js; then \
		echo "Create a test_config.js using test_config.default.js as an example" && \
		exit 1; \
	fi

check-deps:
	@if test ! -d node_modules; then \
		echo "Installing npm dependencies.."; \
		npm install -d; \
	fi

.PHONY: check dependencies lint
