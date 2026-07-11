
ALTER VIEW public.drivers_public SET (security_invoker = true);

REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.log_shipment_status() FROM PUBLIC, authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.notify_role_change() FROM PUBLIC, authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.validate_invoice_amount() FROM PUBLIC, authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.protect_shipment_update() FROM PUBLIC, authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, authenticated, anon;
