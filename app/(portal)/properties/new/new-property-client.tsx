"use client";

import { useState } from "react";
import PropertyForm from "@/components/property-form";
import PropertyImageUpload from "@/components/property-image-upload";

type TeamMember = { id: string; name: string; role: string };

export default function NewPropertyClient({
  teamMembers,
  userId,
}: {
  teamMembers: TeamMember[];
  userId: string;
}) {
  const [autoPropertyId, setAutoPropertyId] = useState<string | undefined>();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Property</h1>
        <p className="text-sm text-gray-500 mt-1">
          Fill in the details below. You can save as draft at any time.
        </p>
      </div>

      <section className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Images</h2>
        <PropertyImageUpload
          userId={userId}
          onPropertyCreated={(id) => setAutoPropertyId(id)}
        />
      </section>

      <PropertyForm
        teamMembers={teamMembers}
        userId={userId}
        property={
          autoPropertyId ? { id: autoPropertyId, status: "draft" } : undefined
        }
      />
    </div>
  );
}
