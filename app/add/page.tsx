import { requireUser } from "@/lib/session";
import AddTradeForm from "./form";

export const dynamic = "force-dynamic";

export default async function AddPage() {
  await requireUser();
  return (
    <main>
      <div className="pagehead">
        <div>
          <h1>Add Trade</h1>
          <p>Upload a screenshot, review the extracted fields, then save.</p>
        </div>
      </div>
      <AddTradeForm />
    </main>
  );
}
