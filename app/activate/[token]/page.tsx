import ActivateInvitation from "@/components/auth/ActivateInvitation";

export const metadata = { title: "Activate merchant account" };
export default function ActivatePage({ params }: { params: { token: string } }) { return <main className="activation-page"><ActivateInvitation token={params.token} /></main>; }

