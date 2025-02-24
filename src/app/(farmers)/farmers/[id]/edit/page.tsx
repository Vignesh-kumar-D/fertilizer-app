import { FarmerForm } from '@/components/farmers/farmer-form';

type Props = {
  params: { id: string };
};
export default function EditFarmerPage({ params }: Props) {
  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Edit Farmer</h1>
      <FarmerForm farmerId={params.id} />
    </div>
  );
}
