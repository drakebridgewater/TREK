.PHONY: dev install

dev:
	@trap 'kill 0' INT; \
	(cd server && npm run dev) & \
	(cd client && npm run dev) & \
	wait

install:
	(cd server && npm install) && (cd client && npm install)
