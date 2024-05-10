.PHONY: build test

setup:
	@npm i
	@npm install --global rollup

build:
	./node_modules/.bin/rollup -c

pretty:
	@npx prettier ./src ./test --write
	
lint:
	@npx eslint ./src --fix

check:
	@echo "Typechecking Js"
	./node_modules/.bin/tsc

serve:
	@npm run serve
