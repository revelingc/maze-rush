import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Deletes the calling user's account and data for this app. The frontend then
// logs the session out. Best-effort: each step is guarded so a partial failure
// still clears what it can.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Clear the user's purchase records (service role bypasses RLS).
    try {
      await base44.asServiceRole.entities.Base44Purchase.deleteMany({ appUserId: user.id });
    } catch (e) {
      console.error('delete-account: clear purchases failed:', e?.message || e);
    }

    // Delete the user's app record so they can no longer access this app.
    try {
      await base44.asServiceRole.entities.User.delete(user.id);
    } catch (e) {
      console.error('delete-account: delete user record failed:', e?.message || e);
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error('delete-account error:', error?.message || error);
    return Response.json({ error: error?.message || 'Failed to delete account' }, { status: 500 });
  }
}