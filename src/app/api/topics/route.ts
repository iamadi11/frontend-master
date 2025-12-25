import { NextResponse } from "next/server";
import { listTopics } from "@/lib/content";

export async function GET() {
  try {
    const topics = await listTopics();
    return NextResponse.json(topics);
  } catch (error) {
    console.error("Failed to fetch topics:", error);
    return NextResponse.json(
      { error: "Failed to fetch topics" },
      { status: 500 }
    );
  }
}
