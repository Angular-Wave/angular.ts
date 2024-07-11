.PHONY: build test

setup:
	@npm i
	@npx playwright install
	
build:
	./node_modules/.bin/rollup -c

pretty:
	@npx prettier ./src ./test ./types --write
	
lint:
	@npx eslint ./src --fix

check:
	@echo "Typechecking Js"
	./node_modules/.bin/tsc 

types:
	@echo "Generating *.d.ts"
	@npx -p typescript tsc src/**/*.js --declaration --allowJs --emitDeclarationOnly --outDir types

serve:
	@npm run serve

PLAYWRIGHT_TEST := npx playwright test

test:
	@echo $(INFO) "Playwright test JS"
	@$(PLAYWRIGHT_TEST) 

test-ui:
	@echo $(INFO) "Playwright test JS with ui"
	@$(PLAYWRIGHT_TEST) --ui