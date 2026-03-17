-- Permite que usuarios con role='admin' en profiles puedan actualizar productos.
-- Ejecuta este script en el SQL Editor de Supabase si los admins no pueden cambiar disponibilidad.
-- Si ya existe una política con ese nombre, elimínala primero: drop policy if exists "Admins can update products" on public.products;

-- Política para que admins actualicen products
drop policy if exists "Admins can update products" on public.products;
create policy "Admins can update products"
  on public.products
  for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );
