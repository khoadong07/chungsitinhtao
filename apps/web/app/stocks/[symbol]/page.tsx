import Link from 'next/link';

interface Props {
  params: Promise<{ symbol: string }>;
}

export default async function SymbolPage({ params }: Props) {
  const { symbol } = await params;
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Về trang chủ</Link>
      <h1 className="text-2xl font-bold">{symbol.toUpperCase()}</h1>
      <p className="text-gray-500 mt-2">Sử dụng trang chủ để phân tích mã này.</p>
    </div>
  );
}
