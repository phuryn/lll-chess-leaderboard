-- Drop existing permissive INSERT and UPDATE policies
DROP POLICY IF EXISTS "Games are publicly insertable" ON public.games;
DROP POLICY IF EXISTS "Games are publicly updatable" ON public.games;

-- Create new policies that require authentication for write operations
CREATE POLICY "Authenticated users can insert games"
ON public.games
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update games"
ON public.games
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete games"
ON public.games
FOR DELETE
TO authenticated
USING (true);