REPORTER?=dot
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

lint: check-deps
	@./node_modules/.bin/jshint -c ./.jshintrc lib test

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

coverage: check-deps
	@./node_modules/.bin/istanbul cover \
		./node_modules/.bin/_mocha -- -R spec

coverage-html: coverage
	@open coverage/lcov-report/index.html

clean:
	@rm -rf coverage

.PHONY: check dependencies lint coverage
