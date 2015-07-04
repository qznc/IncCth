all:
	@echo "Just open index.html"

.PHONY: publish

publish:
	git push github cthulhu:gh-pages
