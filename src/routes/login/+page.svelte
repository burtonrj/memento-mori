<script lang="ts">
	import { enhance } from '$app/forms';
	let { form } = $props();
</script>

<div class="container h-screen mx-auto flex justify-center items-center p-4">
	<div class="card p-8 w-full max-w-sm space-y-6 text-center bg-surface-100-800-token shadow-xl">
		<div class="space-y-2">
			<h2 class="h2 font-bold">Memento Mori</h2>
			<p class="text-surface-600-300-token">Login to access your dashboard.</p>
		</div>

		<form method="POST" use:enhance class="space-y-4">
			<label class="label text-left">
				<span>Password</span>
				<input
					class="input"
					type="password"
					name="password"
					required
					placeholder="Enter password"
				/>
			</label>

			{#if form?.error}
				<div class="alert variant-filled-error">{form.error}</div>
			{/if}

			<button class="btn variant-filled-primary w-full font-bold">Login</button>
		</form>
	</div>
</div>
