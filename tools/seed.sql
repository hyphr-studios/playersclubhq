-- ═══ SEED: run AFTER schema.sql ═══
begin;

insert into projects (id, issue_no, title, subtitle, status, shot_on, published_on) values
  ('swim-001', 1, 'SWIM', 'Poolside Luxe', 'published', '2025-08-14', '2025-08-31'),
  ('no-boys-allowed', 2, 'NO.BOYS.ALLOWED™', 'The Slumber Party Tape', 'casting', null, null)
on conflict (id) do nothing;


-- STAFF. Replace LJ's placeholder with his real address before inviting him.
insert into profiles (email, role, name, handle, since) values
  ('stanleyfontaine83@gmail.com', 'founder', 'Tray D.', 'Founder', '2025-08-14'),
  ('lj.pending@playersclubhq.com', 'partner', 'LJ', 'Partner', '2025-08-14')
on conflict (email) do nothing;

-- MODELS. Placeholder emails: replace each with her real address, then invite her.
insert into profiles (email, role, name, handle, since) values
  ('karma.pending@playersclubhq.com', 'model', 'Karma', NULL, '2025-08-14'),
  ('cherri.pending@playersclubhq.com', 'model', 'Cherri', '@cherri.armiko', '2025-08-14'),
  ('kaykay.pending@playersclubhq.com', 'model', 'Kay Kay', '@kaykay.monique', '2025-08-14'),
  ('naiomi.pending@playersclubhq.com', 'model', 'Naiomi', '@fine_ass_nai', '2025-08-14'),
  ('ivorie.pending@playersclubhq.com', 'model', 'Ivorie', '@ivorieeeeee_', '2025-08-14')
on conflict (email) do nothing;

insert into assets (project_id, kind, path, set_name, seq, frame, taken_at, camera, lens, iso, aperture, shutter, focal, approved) values
  ('swim-001', 'photo', 'assets/photos/swim-001/sets/karma/karma-01.jpg', 'Karma — Uncut', 1, 'Header Picture', '2025-08-14 18:34:29-07:00', 'Canon Canon EOS M50m2', 'EF50mm f/1.8 STM', 200, 'f/7.1', '1/250', '50mm', true),
  ('swim-001', 'photo', 'assets/photos/swim-001/sets/karma/karma-02.jpg', 'Karma — Uncut', 2, 'IMG_3239', '2025-08-14 18:33:31-07:00', 'Canon Canon EOS M50m2', 'EF50mm f/1.8 STM', 200, 'f/7.1', '1/320', '50mm', true),
  ('swim-001', 'photo', 'assets/photos/swim-001/sets/karma/karma-03.jpg', 'Karma — Uncut', 3, 'IMG_3240', '2025-08-14 18:33:35-07:00', 'Canon Canon EOS M50m2', 'EF50mm f/1.8 STM', 200, 'f/7.1', '1/320', '50mm', true),
  ('swim-001', 'photo', 'assets/photos/swim-001/sets/karma/karma-04.jpg', 'Karma — Uncut', 4, 'IMG_3244', '2025-08-14 18:34:20-07:00', 'Canon Canon EOS M50m2', 'EF50mm f/1.8 STM', 200, 'f/7.1', '1/320', '50mm', true),
  ('swim-001', 'photo', 'assets/photos/swim-001/sets/karma/karma-05.jpg', 'Karma — Uncut', 5, 'IMG_3250', '2025-08-14 18:35:08-07:00', 'Canon Canon EOS M50m2', 'EF50mm f/1.8 STM', 200, 'f/7.1', '1/250', '50mm', true),
  ('swim-001', 'photo', 'assets/photos/swim-001/sets/karma/karma-06.jpg', 'Karma — Uncut', 6, 'SWIM 001 Cover (No Text).jpeg', '2025-08-14 18:33:53-07:00', 'Canon Canon EOS M50m2', 'EF50mm f/1.8 STM', 200, 'f/7.1', '1/250', '50mm', true),
  ('swim-001', 'photo', 'assets/photos/swim-001/sets/karma/karma-07.jpg', 'Karma — Uncut', 7, 'IMG_3237', '2025-08-14 18:33:19-07:00', 'Canon Canon EOS M50m2', 'EF50mm f/1.8 STM', 200, 'f/7.1', '1/320', '50mm', true),
  ('swim-001', 'photo', 'assets/photos/swim-001/sets/karma/karma-08.jpg', 'Karma — Uncut', 8, 'IMG_3242', '2025-08-14 18:33:55-07:00', 'Canon Canon EOS M50m2', 'EF50mm f/1.8 STM', 200, 'f/7.1', '1/250', '50mm', true),
  ('swim-001', 'photo', 'assets/photos/swim-001/sets/cherri/cherri-01.jpg', 'Cherri — B-Sides', 1, 'IMG_3310', '2025-08-14 18:57:44-07:00', 'Canon Canon EOS M50m2', 'EF50mm f/1.8 STM', 640, 'f/8', '1/80', '50mm', true),
  ('swim-001', 'photo', 'assets/photos/swim-001/sets/cherri/cherri-02.jpg', 'Cherri — B-Sides', 2, 'IMG_3316', '2025-08-14 18:59:05-07:00', 'Canon Canon EOS M50m2', 'EF50mm f/1.8 STM', 2000, 'f/8', '1/100', '50mm', true),
  ('swim-001', 'photo', 'assets/photos/swim-001/sets/cherri/cherri-03.jpg', 'Cherri — B-Sides', 3, 'IMG_3320', '2025-08-14 18:59:17-07:00', 'Canon Canon EOS M50m2', 'EF50mm f/1.8 STM', 2000, 'f/8', '1/80', '50mm', true),
  ('swim-001', 'photo', 'assets/photos/swim-001/sets/cherri/cherri-04.jpg', 'Cherri — B-Sides', 4, 'IMG_3324', '2025-08-14 18:59:51-07:00', 'Canon Canon EOS M50m2', 'EF50mm f/1.8 STM', 1600, 'f/8', '1/80', '50mm', true),
  ('swim-001', 'photo', 'assets/photos/swim-001/sets/kaykay/kaykay-01.jpg', 'Kay Kay — Extended', 1, 'IMG_3275', '2025-08-14 18:45:52-07:00', 'Canon Canon EOS M50m2', 'EF50mm f/1.8 STM', 320, 'f/8', '1/100', '50mm', true),
  ('swim-001', 'photo', 'assets/photos/swim-001/sets/kaykay/kaykay-02.jpg', 'Kay Kay — Extended', 2, 'IMG_3279', '2025-08-14 18:46:44-07:00', 'Canon Canon EOS M50m2', 'EF50mm f/1.8 STM', 250, 'f/8', '1/100', '50mm', true),
  ('swim-001', 'photo', 'assets/photos/swim-001/sets/naiomi/naiomi-01.jpg', 'Naiomi', 1, 'IMG_3259', '2025-08-14 18:38:01-07:00', 'Canon Canon EOS M50m2', 'EF50mm f/1.8 STM', 500, 'f/8', '1/100', '50mm', true),
  ('swim-001', 'photo', 'assets/photos/swim-001/sets/naiomi/naiomi-02.jpg', 'Naiomi', 2, 'IMG_3260', '2025-08-14 18:38:13-07:00', 'Canon Canon EOS M50m2', 'EF50mm f/1.8 STM', 320, 'f/8', '1/100', '50mm', true),
  ('swim-001', 'photo', 'assets/photos/swim-001/sets/naiomi/naiomi-03.jpg', 'Naiomi', 3, 'IMG_3288', '2025-08-14 18:48:59-07:00', 'Canon Canon EOS M50m2', 'EF50mm f/1.8 STM', 200, 'f/8', '1/125', '50mm', true),
  ('swim-001', 'photo', 'assets/photos/swim-001/sets/ivorie/ivorie-02.jpg', 'Ivorie — BTS', 1, 'IMG_3218', '2025-08-14 18:30:13-07:00', 'Canon Canon EOS M50m2', 'EF50mm f/1.8 STM', 200, 'f/7.1', '1/125', '50mm', true),
  ('swim-001', 'photo', 'assets/photos/swim-001/sets/ivorie/ivorie-03.jpg', 'Ivorie — BTS', 2, 'IMG_3219', '2025-08-14 18:30:18-07:00', 'Canon Canon EOS M50m2', 'EF50mm f/1.8 STM', 200, 'f/7.1', '1/125', '50mm', true),
  ('swim-001', 'photo', 'assets/photos/swim-001/sets/ivorie/ivorie-04.jpg', 'Ivorie — BTS', 3, 'IMG_3220', '2025-08-14 18:30:30-07:00', 'Canon Canon EOS M50m2', 'EF50mm f/1.8 STM', 200, 'f/7.1', '1/100', '50mm', true),
  ('swim-001', 'photo', 'assets/photos/swim-001/sets/afterhours/duo-01.jpg', 'After Hours', 1, 'Cherri & Karma', '2025-08-14 19:03:26-07:00', 'Canon Canon EOS M50m2', 'EF50mm f/1.8 STM', 320, 'f/8', '1/100', '50mm', true),
  ('swim-001', 'photo', 'assets/photos/swim-001/sets/afterdark/ad-01.jpg', 'After Dark — Do Not Disturb', 1, 'IMG_0715', '2025-08-14 18:54:20-07:00', 'Canon Canon EOS M50m2', 'EF50mm f/1.8 STM', 250, 'f/8', '1/100', '50mm', true),
  ('swim-001', 'photo', 'assets/photos/swim-001/sets/afterdark/ad-group-night.jpg', 'After Dark — Group Photos', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, true),
  ('swim-001', 'photo', 'assets/photos/swim-001/sets/afterdark/ad-02.jpg', 'After Dark — Group Photos', 2, 'IMG_3363', '2025-08-14 19:09:55-07:00', 'Canon Canon EOS M50m2', 'EF50mm f/1.8 STM', 640, 'f/8', '1/13', '50mm', true),
  ('swim-001', 'video', 'assets/video/swim-001/the-cut.mp4', 'SWIM 001 — The Cut', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, true),
  ('swim-001', 'video', 'assets/video/swim-001/reel-01.mp4', 'Deck Tape 01', 2, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, true),
  ('swim-001', 'video', 'assets/video/swim-001/reel-02.mp4', 'Deck Tape 02', 3, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, true),
  ('swim-001', 'video', 'assets/video/swim-001/reel-03.mp4', 'Deck Tape 03', 4, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, true),
  ('swim-001', 'video', 'assets/video/swim-001/karma-reel-01.mp4', 'Karma — Motion I', 5, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, true),
  ('swim-001', 'video', 'assets/video/swim-001/karma-reel-02.mp4', 'Karma — Motion II', 6, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, true)
on conflict (path) do nothing;

insert into asset_credits (asset_id, profile_id)
select a.id, p.id from (values
  ('assets/photos/swim-001/sets/karma/karma-01.jpg', 'karma.pending@playersclubhq.com'),
  ('assets/photos/swim-001/sets/karma/karma-02.jpg', 'karma.pending@playersclubhq.com'),
  ('assets/photos/swim-001/sets/karma/karma-03.jpg', 'karma.pending@playersclubhq.com'),
  ('assets/photos/swim-001/sets/karma/karma-04.jpg', 'karma.pending@playersclubhq.com'),
  ('assets/photos/swim-001/sets/karma/karma-05.jpg', 'karma.pending@playersclubhq.com'),
  ('assets/photos/swim-001/sets/karma/karma-06.jpg', 'karma.pending@playersclubhq.com'),
  ('assets/photos/swim-001/sets/karma/karma-07.jpg', 'karma.pending@playersclubhq.com'),
  ('assets/photos/swim-001/sets/karma/karma-08.jpg', 'karma.pending@playersclubhq.com'),
  ('assets/photos/swim-001/sets/cherri/cherri-01.jpg', 'cherri.pending@playersclubhq.com'),
  ('assets/photos/swim-001/sets/cherri/cherri-02.jpg', 'cherri.pending@playersclubhq.com'),
  ('assets/photos/swim-001/sets/cherri/cherri-03.jpg', 'cherri.pending@playersclubhq.com'),
  ('assets/photos/swim-001/sets/cherri/cherri-04.jpg', 'cherri.pending@playersclubhq.com'),
  ('assets/photos/swim-001/sets/kaykay/kaykay-01.jpg', 'kaykay.pending@playersclubhq.com'),
  ('assets/photos/swim-001/sets/kaykay/kaykay-02.jpg', 'kaykay.pending@playersclubhq.com'),
  ('assets/photos/swim-001/sets/naiomi/naiomi-01.jpg', 'naiomi.pending@playersclubhq.com'),
  ('assets/photos/swim-001/sets/naiomi/naiomi-02.jpg', 'naiomi.pending@playersclubhq.com'),
  ('assets/photos/swim-001/sets/naiomi/naiomi-03.jpg', 'naiomi.pending@playersclubhq.com'),
  ('assets/photos/swim-001/sets/ivorie/ivorie-02.jpg', 'ivorie.pending@playersclubhq.com'),
  ('assets/photos/swim-001/sets/ivorie/ivorie-03.jpg', 'ivorie.pending@playersclubhq.com'),
  ('assets/photos/swim-001/sets/ivorie/ivorie-04.jpg', 'ivorie.pending@playersclubhq.com'),
  ('assets/photos/swim-001/sets/afterhours/duo-01.jpg', 'cherri.pending@playersclubhq.com'),
  ('assets/photos/swim-001/sets/afterhours/duo-01.jpg', 'karma.pending@playersclubhq.com'),
  ('assets/photos/swim-001/sets/afterdark/ad-01.jpg', 'naiomi.pending@playersclubhq.com'),
  ('assets/photos/swim-001/sets/afterdark/ad-group-night.jpg', 'karma.pending@playersclubhq.com'),
  ('assets/photos/swim-001/sets/afterdark/ad-group-night.jpg', 'naiomi.pending@playersclubhq.com'),
  ('assets/photos/swim-001/sets/afterdark/ad-group-night.jpg', 'kaykay.pending@playersclubhq.com'),
  ('assets/photos/swim-001/sets/afterdark/ad-02.jpg', 'karma.pending@playersclubhq.com'),
  ('assets/photos/swim-001/sets/afterdark/ad-02.jpg', 'naiomi.pending@playersclubhq.com'),
  ('assets/photos/swim-001/sets/afterdark/ad-02.jpg', 'cherri.pending@playersclubhq.com'),
  ('assets/video/swim-001/karma-reel-01.mp4', 'karma.pending@playersclubhq.com'),
  ('assets/video/swim-001/karma-reel-02.mp4', 'karma.pending@playersclubhq.com')
) as v(path, email) join assets a on a.path = v.path join profiles p on p.email = v.email
on conflict do nothing;

insert into placements (project_id, profile_id, role, bonus_units, billing)
select 'swim-001', p.id, v.role::placement_role, v.bonus, v.billing from (values
  ('karma.pending@playersclubhq.com', 'cover', 5, 'Cover — SWIM 001'),
  ('cherri.pending@playersclubhq.com', 'feature', 2, 'Featured Model No. 2 — SWIM 001'),
  ('kaykay.pending@playersclubhq.com', 'feature', 2, 'Featured Model No. 3 — SWIM 001'),
  ('naiomi.pending@playersclubhq.com', 'cast', 0, 'Cast — SWIM 001'),
  ('ivorie.pending@playersclubhq.com', 'bts', 0, 'BTS — SWIM 001')
) as v(email, role, bonus, billing) join profiles p on p.email = v.email
on conflict do nothing;


insert into quarters (id, label, window_start, window_end, paid_on, status) values
  ('2026-Q3', 'Q3 2026', '2026-07-01', '2026-09-30', 'October 2026', 'open'),
  ('2026-Q4', 'Q4 2026', '2026-10-01', '2026-12-31', 'January 2027', 'open')
on conflict (id) do nothing;

commit;

-- sanity: units per model should read Karma 15, Cherri 6, Kay Kay 4, Naiomi 3, Ivorie 3
select p.name, mu.frames, mu.bonus, mu.units, mu.placement from model_units mu join profiles p on p.id = mu.profile_id order by mu.units desc;
