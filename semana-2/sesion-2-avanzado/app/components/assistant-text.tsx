// Componente de servidor. Se transmite (stream) mientras el modelo escribe:
// primero vacio (pending), luego con el texto que va llegando.
export function AssistantText({ content, pending, done }: { content: string; pending?: boolean; done?: boolean }) {
  if (pending && !content) return <p className="typing">pensando...</p>;
  return <p className={done ? undefined : "streaming"}>{content}</p>;
}
