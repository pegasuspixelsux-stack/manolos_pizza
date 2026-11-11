import HomeSwitch from '@/src/components/HomeSwitch';
import { loadHomeData } from '@/src/lib/homeData';
import { sampleHomeProperties } from '@/src/lib/sampleItems';

// Rebuilt at most once a minute, so new or featured listings appear quickly
// without a database request for every visitor.
export const revalidate = 60;

export default async function Page() {
  const { properties } = await loadHomeData();
  return <HomeSwitch initialProperties={properties.length ? properties : sampleHomeProperties} />;
}
