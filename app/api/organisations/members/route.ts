import { NextRequest, NextResponse } from "next/server";
import { getServerAuthUser } from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

/**
 * GET /api/organisations/members?orgId=<uuid>
 * Liste des membres d une organisation
 */
export async function GET(request: NextRequest) {
  const auth = await getServerAuthUser(request);
  if (!auth.authenticated || !auth.user?.id) {
    return NextResponse.json({ success: false, message: "Non connecte" }, { status: 401 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ success: false, message: "Service indisponible" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("orgId");

  if (!orgId) {
    return NextResponse.json({ success: false, message: "orgId requis" }, { status: 400 });
  }

  try {
    // Verifier que le demandeur est membre de l organisation
    const { data: callerMembership } = await supabaseAdmin
      .from("organization_members")
      .select("role")
      .eq("org_id", orgId)
      .eq("user_id", auth.user.id)
      .single();

    if (!callerMembership) {
      return NextResponse.json({ success: false, message: "Acces refuse a cette organisation." }, { status: 403 });
    }

    // Recuperer les membres de l organisation
    const { data: members, error: memErr } = await supabaseAdmin
      .from("organization_members")
      .select("org_id, user_id, role, invite_par, cree_le")
      .eq("org_id", orgId)
      .order("cree_le", { ascending: true });

    if (memErr) {
      return NextResponse.json({ success: false, message: memErr.message }, { status: 500 });
    }

    // Enrichir avec les emails et noms depuis les profils
    const userIds = (members || []).map((m) => m.user_id);
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, email, first_name, last_name")
      .in("id", userIds);

    const enrichedMembers = (members || []).map((m) => {
      const p = (profiles || []).find((pr) => pr.id === m.user_id);
      const computedName = [p?.first_name, p?.last_name].filter(Boolean).join(" ");
      return {
        orgId: m.org_id,
        userId: m.user_id,
        role: m.role,
        creeLe: m.cree_le,
        email: p?.email || "Inconnu",
        fullName: computedName || p?.email?.split("@")[0] || "Membre",
      };
    });

    return NextResponse.json({ success: true, members: enrichedMembers });
  } catch (err: any) {
    console.error("Erreur GET /api/organisations/members:", err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

/**
 * POST /api/organisations/members
 * Inviter/Ajouter un membre dans l organisation
 * body: { orgId, email, role }
 */
export async function POST(request: NextRequest) {
  const auth = await getServerAuthUser(request);
  if (!auth.authenticated || !auth.user?.id) {
    return NextResponse.json({ success: false, message: "Non connecte" }, { status: 401 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ success: false, message: "Service indisponible" }, { status: 503 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { orgId, email, role = "membre" } = body;

    if (!orgId || !email) {
      return NextResponse.json({ success: false, message: "orgId et email requis." }, { status: 400 });
    }

    // Utiliser la fonction SQL atomique add_org_member qui verifie les sieges
    const { data: result, error: rpcErr } = await supabaseAdmin.rpc("add_org_member", {
      p_org_id: orgId,
      p_email: email.trim().toLowerCase(),
      p_role: role,
      p_admin_id: auth.user.id,
    });

    if (rpcErr) {
      return NextResponse.json({ success: false, message: rpcErr.message }, { status: 500 });
    }

    const res = result as { success: boolean; message: string; user_id?: string };
    if (!res.success) {
      return NextResponse.json({ success: false, message: res.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: res.message });
  } catch (err: any) {
    console.error("Erreur POST /api/organisations/members:", err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/organisations/members?orgId=<uuid>&userId=<uuid>
 * Retirer un membre de l organisation
 */
export async function DELETE(request: NextRequest) {
  const auth = await getServerAuthUser(request);
  if (!auth.authenticated || !auth.user?.id) {
    return NextResponse.json({ success: false, message: "Non connecte" }, { status: 401 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ success: false, message: "Service indisponible" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("orgId");
  const targetUserId = searchParams.get("userId");

  if (!orgId || !targetUserId) {
    return NextResponse.json({ success: false, message: "orgId et userId requis." }, { status: 400 });
  }

  try {
    const { data: result, error: rpcErr } = await supabaseAdmin.rpc("remove_org_member", {
      p_org_id: orgId,
      p_target_id: targetUserId,
      p_caller_id: auth.user.id,
    });

    if (rpcErr) {
      return NextResponse.json({ success: false, message: rpcErr.message }, { status: 500 });
    }

    const res = result as { success: boolean; message: string };
    if (!res.success) {
      return NextResponse.json({ success: false, message: res.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: res.message });
  } catch (err: any) {
    console.error("Erreur DELETE /api/organisations/members:", err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
