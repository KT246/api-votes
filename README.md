# cài đặt project

- pnpm add express mongoose dotenv
- pnpm add -D typescript ts-node nodemon @types/node @types/express
- npx tsc --init

# tsconfig.json:

{
"compilerOptions": {
"target": "ES2020",
"module": "CommonJS",
"rootDir": "./src",
"outDir": "./dist",
"esModuleInterop": true,
"strict": true
}
}

# imort excel

- pnpm add multer xlsx
- pnpm add -D @types/multer
