import ClientApp from "@/components/ClientApp";
import { getData } from "@/lib/data";

// Re-read the show data at most every five minutes.
export const revalidate = 300;

export default async function Home() {
  const data = await getData();
  return <ClientApp data={data} />;
}
