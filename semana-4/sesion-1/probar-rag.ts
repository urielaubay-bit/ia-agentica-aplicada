import { ingest, retrieve } from "./rag.ts";

await ingest("docs");
console.log(await retrieve("cuanto cuesta una transferencia SPEI?"));
console.log("---");
console.log(await retrieve("como reporto un cargo que no reconozco?"));
