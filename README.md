# CS732 project - Team PokeMasters

Welcome to the CS732 project. We look forward to seeing the amazing things you create this semester! This is your team's repository.

Your team members are:

- Xingxing Tao _(xtao093@aucklanduni.ac.nz)_
- Mingming Liu _(mliu947@aucklanduni.ac.nz)_
- Shan Liu _(sliu734@aucklanduni.ac.nz)_
- Lingyi Yin _(lyin610@aucklanduni.ac.nz)_
- Pan Wang _(pwan744@aucklanduni.ac.nz)_
- Exa Fann _(xfan744@aucklanduni.ac.nz)_

You have complete control over how you run this repo. All your members will have admin access. The only thing setup by default is branch protections on `main`, requiring a PR with at least one code reviewer to modify `main` rather than direct pushes.

Please use good version control practices, such as feature branching, both to make it easier for markers to see your group's history and to lower the chances of you tripping over each other during development

![](./PokeMasters.png)

后端 env:
PORT=3000
DATABASE = mongodb+srv://pokemasters:<PASSWORD>@cluster0.c5u4t48.mongodb.net/splitmate?retryWrites=true&w=majority&appName=Cluster0
DATABASE_LOCAL = mongodb://localhost:27017/pokemasters
DATABASE_PASSWORD = pw123456

MONGO_URI=mongodb+srv://pokemasters:pw123456@cluster0.c5u4t48.mongodb.net/splitmate?retryWrites=true&w=majority&appName=Cluster0

JWT_SECRET=yourSecretKey123
JWT_EXPIRES_IN=7d

前端：
VITE_API_BASE_URL=http://localhost:3000/api

VITE_AVATAR_BASE_URL=http://localhost:3000
