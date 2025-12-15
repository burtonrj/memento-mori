<script lang="ts">
	import { enhance } from '$app/forms';
	import { Trash2, Plus, Save, ArrowLeft } from 'lucide-svelte';

	let { data } = $props();
</script>

<div class="container mx-auto p-8 space-y-8 max-w-4xl">
	<header class="flex items-center gap-4">
		<a href="/" class="btn variant-soft-surface btn-icon">
			<ArrowLeft class="w-6 h-6" />
		</a>
		<h1 class="h1 font-bold">Affirmations</h1>
	</header>

	<!-- Add New Affirmation -->
	<div class="card p-4 bg-surface-500/5 border border-surface-500/30">
		<form method="POST" action="?/add" use:enhance class="flex gap-4 items-end">
			<label class="label flex-1">
				<span>New Affirmation</span>
				<textarea 
					class="textarea" 
					name="text" 
					rows="2" 
					placeholder="Enter a new affirmation..." 
					required
				></textarea>
			</label>
			<button class="btn variant-filled-primary h-10">
				<Plus class="w-4 h-4 mr-2" /> Add
			</button>
		</form>
	</div>

	<!-- List Affirmations -->
	<div class="space-y-4">
		{#each data.affirmations as affirmation (affirmation.id)}
			<div class="card p-4 bg-surface-500/5 border border-surface-500/30 flex gap-4 items-start">
				<form 
					method="POST" 
					action="?/update" 
					use:enhance={() => {
						return async ({ update }) => {
							await update({ reset: false });
						};
					}} 
					class="flex-1 flex gap-4 items-start"
				>
					<input type="hidden" name="id" value={affirmation.id} />
					<textarea 
						class="textarea flex-1" 
						name="text" 
						rows="2"
					>{affirmation.text}</textarea>
					<button class="btn variant-soft-secondary btn-icon" title="Save Changes">
						<Save class="w-4 h-4" />
					</button>
				</form>

				<form method="POST" action="?/delete" use:enhance>
					<input type="hidden" name="id" value={affirmation.id} />
					<button class="btn variant-soft-error btn-icon" title="Delete">
						<Trash2 class="w-4 h-4" />
					</button>
				</form>
			</div>
		{/each}
	</div>
</div>
