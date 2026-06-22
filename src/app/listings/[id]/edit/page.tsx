"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ListingForm } from "@/components/listing-form";
import { useTelegram } from "@/context/telegram";

interface ListingResponse {
  id: string;
  userId: string;
  title: string;
  description: string;
  price: number;
  originalPrice: number | null;
  currency: string;
  condition: string;
  gender: string;
  size: string | null;
  color: string | null;
  city: string;
  categoryId: string;
  brandId: string;
  quantity: number;
  delivery: string;
  images: Array<{ url: string }>;
}

export default function EditListingPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { token, isLoading, user } = useTelegram();
  const [listing, setListing] = useState<ListingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isLoading || !token || !params?.id) return;

    fetch(`/api/listings/${params.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) {
          throw new Error(body?.error || "Не удалось загрузить объявление");
        }
        return body as ListingResponse;
      })
      .then((data) => {
        if (user?.id && data.userId !== user.id) {
          router.push(`/listings/${params.id}`);
          return;
        }
        setListing(data);
      })
      .catch((fetchError: Error) => setError(fetchError.message))
      .finally(() => setLoading(false));
  }, [isLoading, params?.id, router, token, user?.id]);

  if (loading || isLoading) {
    return <div className="px-4 py-10 text-center text-sm text-neutral-500">Загружаем...</div>;
  }

  if (error || !listing) {
    return (
      <div className="px-4 py-10 text-center text-sm text-red-600">
        {error || "Объявление не найдено"}
      </div>
    );
  }

  return (
    <ListingForm
      mode="edit"
      initialValues={{
        id: listing.id,
        title: listing.title,
        description: listing.description,
        price: listing.price,
        originalPrice: listing.originalPrice,
        currency: listing.currency,
        condition: listing.condition,
        gender: listing.gender,
        size: listing.size,
        color: listing.color,
        city: listing.city,
        categoryId: listing.categoryId,
        brandId: listing.brandId,
        quantity: listing.quantity,
        images: listing.images.map((image) => image.url),
        delivery: (() => {
          try {
            return JSON.parse(listing.delivery || "[]") as string[];
          } catch {
            return [];
          }
        })(),
      }}
    />
  );
}
