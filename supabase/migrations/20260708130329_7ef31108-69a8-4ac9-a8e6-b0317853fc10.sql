
CREATE POLICY roles_self_insert_demo ON public.user_roles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY roles_self_delete_demo ON public.user_roles FOR DELETE TO authenticated USING (user_id = auth.uid());
