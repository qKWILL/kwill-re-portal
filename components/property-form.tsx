"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { saveProperty, type PropertyFormData } from "@/lib/actions/properties";

type TeamMember = { id: string; name: string; role: string };

const PROPERTY_TYPES = [
  "office",
  "retail",
  "industrial",
  "multi-family",
  "land",
  "mixed-use",
];
const TRANSACTION_TYPES = ["for-sale", "for-lease", "for-sale-or-lease"];

export default function PropertyForm({
  teamMembers,
  userId,
  property,
  autoPropertyId,
}: {
  teamMembers: TeamMember[];
  userId: string;
  property?: any;
  autoPropertyId?: string;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [title, setTitle] = useState(property?.title ?? "");
  const [summary, setSummary] = useState(property?.summary ?? "");
  const [description, setDescription] = useState(property?.description ?? "");
  const [address, setAddress] = useState(property?.address ?? "");
  const [city, setCity] = useState(property?.city ?? "");
  const [state, setState] = useState(property?.state ?? "");
  const [zip, setZip] = useState(property?.zip ?? "");
  const [featured, setFeatured] = useState(property?.featured ?? false);
  const [propertyType, setPropertyType] = useState(
    property?.content?.property_type ?? "",
  );
  const [transactionType, setTransactionType] = useState(
    property?.content?.transaction_type ?? "",
  );
  const [sizeSf, setSizeSf] = useState(property?.content?.size_sf ?? "");
  const [price, setPrice] = useState(property?.content?.price ?? "");
  const [leaseRateSf, setLeaseRateSf] = useState(
    property?.content?.lease_rate_sf ?? "",
  );
  const [yearBuilt, setYearBuilt] = useState(
    property?.content?.year_built ?? "",
  );
  const [zoning, setZoning] = useState(property?.content?.zoning ?? "");
  const [parking, setParking] = useState(property?.content?.parking ?? "");
  const [highlights, setHighlights] = useState<string[]>(
    property?.content?.highlights ?? [""],
  );
  const [agents, setAgents] = useState<
    { team_member_id: string; role: string }[]
  >(property?.property_agents ?? []);

  function clearError(key: string) {
    setErrors((prev) => {
      const e = { ...prev };
      delete e[key];
      return e;
    });
  }

  async function handleSave(status: "draft" | "active") {
    setSaving(true);
    setErrors({});
    const data: PropertyFormData = {
      id: property?.id ?? autoPropertyId,
      title,
      summary,
      description,
      address,
      city,
      state,
      zip,
      featured,
      property_type: propertyType,
      transaction_type: transactionType,
      size_sf: sizeSf,
      price,
      lease_rate_sf: leaseRateSf,
      year_built: yearBuilt,
      zoning,
      parking,
      highlights,
      agents,
    };
    const result = await saveProperty(data, status);
    setSaving(false);
    if (!result.success) {
      setErrors(result.errors);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    window.location.href = `/properties/${result.id}`;
  }

  function addHighlight() {
    setHighlights([...highlights, ""]);
  }
  function updateHighlight(i: number, val: string) {
    const h = [...highlights];
    h[i] = val;
    setHighlights(h);
  }
  function removeHighlight(i: number) {
    setHighlights(highlights.filter((_, idx) => idx !== i));
  }

  function addAgent() {
    setAgents([...agents, { team_member_id: "", role: "listing_agent" }]);
  }
  function updateAgent(i: number, key: string, val: string) {
    const a = [...agents];
    a[i] = { ...a[i], [key]: val };
    setAgents(a);
    if (a.some((agent) => agent.team_member_id)) clearError("agents");
  }
  function removeAgent(i: number) {
    const remaining = agents.filter((_, idx) => idx !== i);
    setAgents(remaining);
    if (remaining.some((agent) => agent.team_member_id)) clearError("agents");
  }

  const fieldClass = (name: string) =>
    `w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
      errors[name]
        ? "border-red-400 focus:ring-red-400"
        : "border-gray-300 focus:ring-gray-900"
    }`;
  const FieldError = ({ name }: { name: string }) =>
    errors[name] ? (
      <p className="text-xs text-red-600 mt-1">{errors[name]}</p>
    ) : null;

  return (
    <div className="space-y-6">
      {errors._ && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {errors._}
        </div>
      )}

      {(errors.images || errors.agents) && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 space-y-1">
          {errors.images && (
            <p className="text-sm text-red-600">⚠ {errors.images}</p>
          )}
          {errors.agents && (
            <p className="text-sm text-red-600">⚠ {errors.agents}</p>
          )}
        </div>
      )}

      {/* Basic Info */}
      <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Basic Info</h2>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Title *
          </label>
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (e.target.value) clearError("title");
            }}
            className={fieldClass("title")}
          />
          <FieldError name="title" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Summary{" "}
            <span className="text-gray-400">
              (required to publish — 2-3 sentences)
            </span>
          </label>
          <textarea
            value={summary}
            onChange={(e) => {
              setSummary(e.target.value);
              if (e.target.value) clearError("summary");
            }}
            rows={2}
            className={fieldClass("summary")}
          />
          <FieldError name="summary" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Description <span className="text-gray-400">(recommended)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="featured"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
            className="rounded border-gray-300"
          />
          <label
            htmlFor="featured"
            className="text-xs font-medium text-gray-700"
          >
            Featured listing
          </label>
        </div>
      </section>

      {/* Location */}
      <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Location</h2>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Street Address
          </label>
          <input
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              if (e.target.value) clearError("address");
            }}
            className={fieldClass("address")}
          />
          <FieldError name="address" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              City
            </label>
            <input
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                if (e.target.value) clearError("city");
              }}
              className={fieldClass("city")}
            />
            <FieldError name="city" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              State
            </label>
            <input
              value={state}
              onChange={(e) => {
                setState(e.target.value);
                if (e.target.value) clearError("state");
              }}
              maxLength={2}
              placeholder="TX"
              className={fieldClass("state")}
            />
            <FieldError name="state" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              ZIP
            </label>
            <input
              value={zip}
              onChange={(e) => {
                setZip(e.target.value);
                if (e.target.value) clearError("zip");
              }}
              className={fieldClass("zip")}
            />
            <FieldError name="zip" />
          </div>
        </div>
      </section>

      {/* Property Details */}
      <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">
          Property Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Property Type
            </label>
            <select
              value={propertyType}
              onChange={(e) => {
                setPropertyType(e.target.value);
                if (e.target.value) clearError("property_type");
              }}
              className={fieldClass("property_type")}
            >
              <option value="">Select...</option>
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t} className="capitalize">
                  {t}
                </option>
              ))}
            </select>
            <FieldError name="property_type" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Transaction Type
            </label>
            <select
              value={transactionType}
              onChange={(e) => {
                setTransactionType(e.target.value);
                if (e.target.value) clearError("transaction_type");
              }}
              className={fieldClass("transaction_type")}
            >
              <option value="">Select...</option>
              {TRANSACTION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <FieldError name="transaction_type" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Size (SF)
            </label>
            <input
              type="number"
              value={sizeSf}
              onChange={(e) => setSizeSf(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Price
            </label>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g. $2,500,000"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Lease Rate ($/SF)
            </label>
            <input
              value={leaseRateSf}
              onChange={(e) => setLeaseRateSf(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Year Built
            </label>
            <input
              type="number"
              value={yearBuilt}
              onChange={(e) => setYearBuilt(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Zoning
            </label>
            <input
              value={zoning}
              onChange={(e) => setZoning(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Parking
            </label>
            <input
              value={parking}
              onChange={(e) => setParking(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Highlights
          </label>
          <div className="space-y-2">
            {highlights.map((h, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={h}
                  onChange={(e) => updateHighlight(i, e.target.value)}
                  placeholder={`Highlight ${i + 1}`}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <button
                  onClick={() => removeHighlight(i)}
                  type="button"
                  className="text-gray-400 hover:text-red-500 px-2 text-sm"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              onClick={addHighlight}
              type="button"
              className="text-xs text-gray-500 hover:text-gray-900 underline"
            >
              + Add highlight
            </button>
          </div>
        </div>
      </section>

      {/* Agents */}
      <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Listing Agents</h2>
        <div className="space-y-2">
          {agents.map((a, i) => (
            <div key={i} className="flex gap-2 items-center">
              <select
                value={a.team_member_id}
                onChange={(e) =>
                  updateAgent(i, "team_member_id", e.target.value)
                }
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="">Select agent...</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <select
                value={a.role}
                onChange={(e) => updateAgent(i, "role", e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="listing_agent">Listing Agent</option>
                <option value="co-listing_agent">Co-Listing Agent</option>
              </select>
              <button
                onClick={() => removeAgent(i)}
                type="button"
                className="text-gray-400 hover:text-red-500 px-2 text-sm"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            onClick={addAgent}
            type="button"
            className="text-xs text-gray-500 hover:text-gray-900 underline"
          >
            + Add agent
          </button>
        </div>
      </section>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pb-8">
        <Button
          onClick={() => handleSave("draft")}
          disabled={saving}
          variant="outline"
          className="flex-1 sm:flex-none"
        >
          {saving ? "Saving..." : "Save Draft"}
        </Button>
        <Button
          onClick={() => handleSave("active")}
          disabled={saving}
          className="flex-1 sm:flex-none"
        >
          {saving ? "Publishing..." : "Publish"}
        </Button>
        <button
          onClick={() => router.back()}
          type="button"
          className="text-sm text-gray-500 hover:text-gray-900 sm:ml-auto"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
