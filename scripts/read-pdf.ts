import fs from 'fs';
import pdf from 'pdf-parse';

async function main() {
    try {
        const dataBuffer = fs.readFileSync('CONTEXTO DEL PROYECTO.pdf');
        const data = await pdf(dataBuffer);
        fs.writeFileSync('contexto.txt', data.text);
        console.log('PDF extracted to contexto.txt');
    } catch(e) {
        console.error(e);
    }
}
main();
