git clone https://github.com/ErickWendel/semana-javascript-expert05.git --recurse-submodules
cd semana-javascript-expert05
rm -rf initial-template/.git 
cp initial-template aulas/aula01/gdrive-webapp -r
rm -rf initial-template
cd aulas/aula01/gdrive-webapp 
npm install --silent 

cd aulas/aula01/gdrive-webapi 
npm init -y --scope @fabianofps
npm i -D jest@27 nodemon@2.0
npm i pino@6.8 pino-pretty@5.1 socket.io@4.1