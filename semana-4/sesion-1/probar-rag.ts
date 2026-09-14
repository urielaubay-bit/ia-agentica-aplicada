import { ingest, retrieve } from "./rag.ts";

await ingest("docs");
console.log(await retrieve("cual es el horario?"));
console.log("---");
console.log(await retrieve("puedo devolver un producto?"));
