export async function loader() {
  throw new Response("Not Found", { status: 404 });
}

export default function NotFoundPlaceholder() {
  return null;
}
