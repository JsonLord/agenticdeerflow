// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/chat');
  // Note: redirect() throws a NEXT_REDIRECT error, so execution stops here.
  // No need to return null or any JSX.
}
