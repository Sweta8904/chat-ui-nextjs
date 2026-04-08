export async function POST(req: Request) {
  const body = await req.json();

  await new Promise((res) => setTimeout(res, 1000));

  return Response.json({
    reply: "Bot: " + body.message,
  });
}