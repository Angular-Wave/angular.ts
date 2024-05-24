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

PLAYWRIGHT_TEST := npx playwright test

test:
	@echo $(INFO) "Playwright test JS"
	@$(PLAYWRIGHT_TEST) 

test-ui:
	@echo $(INFO) "Playwright test JS with ui"
	@$(PLAYWRIGHT_TEST) --ui