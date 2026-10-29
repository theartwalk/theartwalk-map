import ClientApp from "@/components/ClientApp";
import { getData } from "@/lib/sheet";

// Re-read the Google Sheet at most every five minutes.
export const revalidate = 300;

export default async function Home() {
  const data = await getData();
  return <ClientApp data={data} />;
}
