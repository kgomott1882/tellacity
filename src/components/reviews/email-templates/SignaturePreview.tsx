 "use client"
 
 type Signature = {
   signature_enabled?: boolean
   signature_name?: string | null
   signature_title?: string | null
   signature_phone?: string | null
   signature_website?: string | null
   signature_address?: string | null
   signature_cta_text?: string | null
   signature_cta_url?: string | null
   remove_tellacity_branding?: boolean
 }
 
export type SignatureState = {
  signature_enabled: boolean
  signature_name: string
  signature_title: string
  signature_phone: string
  signature_email: string
  signature_website: string
  signature_logo_url: string
  signature_address: string
  signature_cta_text: string
  signature_cta_url: string
}

type Props = {
  signature: Signature
}

export default function SignaturePreview({ signature }: Props) {
  if (!signature?.signature_enabled) {
    return (
      <div className="mt-4 rounded-lg border bg-gray-50 p-4 text-sm text-gray-500">
        Signature disabled
      </div>
    )
  }

  return (
    <div className="mt-4 rounded-lg border bg-gray-50 p-4 text-sm space-y-1">
      {signature.signature_name && (
        <div className="font-semibold">{signature.signature_name}</div>
      )}

      {signature.signature_title && (
        <div>{signature.signature_title}</div>
      )}

      {signature.signature_phone && (
        <div>{signature.signature_phone}</div>
      )}

      {signature.signature_website && (
        <div>{signature.signature_website}</div>
      )}

      {signature.signature_address && (
        <div>{signature.signature_address}</div>
      )}

      {signature.signature_cta_text && signature.signature_cta_url && (
        <div className="mt-2">
          <a
            href="#"
            className="inline-block rounded bg-black px-3 py-1 text-white text-xs"
          >
            {signature.signature_cta_text}
          </a>
        </div>
      )}

      {!signature.remove_tellacity_branding && (
        <div className="mt-3 text-xs text-gray-400">
          Powered by Tellacity
        </div>
      )}
    </div>
  )
}

