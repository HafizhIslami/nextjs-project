import MerchantRecord from "@/components/platform/MerchantRecord";

export const metadata = { title: "Merchant record" };
export default function MerchantRecordPage({ params }: { params: { id: string } }) { return <MerchantRecord id={params.id} />; }

