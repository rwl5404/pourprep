import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import Header from '../../components/Header';
import KitView from './KitView';
import { getUser } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function KitPage({ params }) {
  const user = await getUser();
  if (!user) redirect('/login');

  const { id } = await params;
  const kitId = parseInt(id, 10);
  if (!Number.isInteger(kitId)) notFound();

  const sql = db();
  const staff = user.role === 'staff';
  const ownerId = staff ? user.owner_id : user.id;
  const rows = await sql`SELECT id, bar_name, content, created_at FROM kits WHERE id = ${kitId} AND user_id = ${ownerId}`;
  const kit = rows[0];
  if (!kit) notFound();

  return (
    <div className="wrap">
      <Header user={user} />
      <Link href="/dashboard" className="back-link">{staff ? '← My training' : '← All kits'}</Link>
      <div className="dash-head">
        <div>
          <span className="badge">Training kit</span>
          <h1>{kit.bar_name}</h1>
        </div>
      </div>
      <div style={{ marginBottom: 64 }}>
        <KitView content={kit.content} kitId={kit.id} trackScores={staff} />
      </div>
    </div>
  );
}
