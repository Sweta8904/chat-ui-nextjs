// lib/webSearch.ts
import axios from "axios";

export async function searchWeb(query: string) {
  const res = await axios.post(
    "https://api.tavily.com/search",
    {
      query,
      max_results: 3,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
      },
    }
  );

  return res.data.results;
}