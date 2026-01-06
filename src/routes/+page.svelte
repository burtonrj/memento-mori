<script lang="ts">
	import {
		ChevronDown,
		Plus,
		Trash2,
		SquareCheck,
		Square,
		Lock,
		LockOpen,
		Eraser
	} from 'lucide-svelte';
	import { Accordion } from '@skeletonlabs/skeleton-svelte';
	import { enhance } from '$app/forms';

	let { data } = $props();
	const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
	const hours = Array.from({ length: 16 }, (_, i) => i + 7);

	// Affirmation navigation state
	let affirmations = $state<Array<{ id: number; text: string }>>([]);
	let currentAffirmationIndex = $state(0);

	// Initialize index to match the displayed affirmation
	$effect(() => {
		affirmations = data.affirmations || [];
		if (data.affirmation && affirmations.length > 0) {
			const matchIndex = affirmations.findIndex((a) => a.text === data.affirmation);
			currentAffirmationIndex = matchIndex >= 0 ? matchIndex : 0;
		}
	});

	// Computed displayed affirmation
	let displayedAffirmation = $derived(
		affirmations.length > 0 &&
			currentAffirmationIndex >= 0 &&
			currentAffirmationIndex < affirmations.length &&
			affirmations[currentAffirmationIndex]
			? affirmations[currentAffirmationIndex].text
			: data.affirmation
	);

	function prevAffirmation() {
		if (affirmations.length === 0) return;
		currentAffirmationIndex =
			currentAffirmationIndex === 0 ? affirmations.length - 1 : currentAffirmationIndex - 1;
	}

	function nextAffirmation() {
		if (affirmations.length === 0) return;
		currentAffirmationIndex =
			currentAffirmationIndex === affirmations.length - 1 ? 0 : currentAffirmationIndex + 1;
	}

	// State
	type Allocation = {
		id?: number;
		blockType: string;
		necessityBlockId: number | null;
		dayOfWeek: number;
		hourSlot: number;
	};

	// svelte-ignore state_referenced_locally
	let allocations = $state<Allocation[]>(data.allocations || []);
	let isLocked = $state(false);
	// svelte-ignore state_referenced_locally
	let timeRemaining = $state(data.deathClock?.hoursLeft || 0);

	// Purpose label editing
	let editingPurposeLabel = $state(false);
	// svelte-ignore state_referenced_locally
	let purposeLabelInput = $state(data.deathClock?.purposeLabel || '');

	// Brick selection accumulator
	let selectedBlock = $state<{ blockType: string; necessityBlockId: number | null } | null>(null);
	let selectedCount = $state(0);

	function selectBrick(blockType: string, necessityBlockId: number | null) {
		// If clicking the same block type, increment count
		if (
			selectedBlock?.blockType === blockType &&
			selectedBlock?.necessityBlockId === necessityBlockId
		) {
			selectedCount++;
		} else {
			// Different block or first click - reset selection
			selectedBlock = { blockType, necessityBlockId };
			selectedCount = 1;
		}
	}

	function clearSelection() {
		selectedBlock = null;
		selectedCount = 0;
	}

	function isSelected(blockType: string, necessityBlockId: number | null): boolean {
		return (
			selectedBlock?.blockType === blockType && selectedBlock?.necessityBlockId === necessityBlockId
		);
	}

	$effect(() => {
		allocations = data.allocations || [];
	});

	$effect(() => {
		if (!data.deathClock) return;
		const deathClock = data.deathClock;

		const updateClock = () => {
			const birth = new Date(deathClock.birthDate);
			const death = new Date(birth);
			death.setFullYear(birth.getFullYear() + deathClock.lifespan);
			const now = new Date();
			const msLeft = death.getTime() - now.getTime();
			timeRemaining = msLeft / (1000 * 60 * 60);
		};

		updateClock();
		const interval = setInterval(updateClock, 1000);
		return () => clearInterval(interval);
	});

	// Helper to get block info for display
	function getBlockInfo(allocation: Allocation) {
		if (allocation.blockType === 'purpose') {
			return {
				name: data.deathClock?.purposeLabel || 'Primary Focus',
				color: data.purposeColor
			};
		}
		const block = data.necessityBlocks.find((b) => b.id === allocation.necessityBlockId);
		return block ? { name: block.name, color: block.color } : null;
	}

	// Drag and Drop - with brick accumulator
	function handleDragStart(e: DragEvent, blockType: string, necessityBlockId: number | null) {
		if (isLocked) {
			e.preventDefault();
			return;
		}

		// Use accumulated selection if it matches, otherwise use 1 brick
		const count =
			selectedBlock?.blockType === blockType && selectedBlock?.necessityBlockId === necessityBlockId
				? selectedCount
				: 1;

		e.dataTransfer?.setData(
			'application/json',
			JSON.stringify({ blockType, necessityBlockId, count })
		);
		e.dataTransfer!.effectAllowed = 'copy';
	}

	function handleDragEnd() {
		// Clear selection after drag completes
		clearSelection();
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		e.dataTransfer!.dropEffect = 'copy';
	}

	function handleDrop(e: DragEvent, dayIndex: number, hour: number) {
		e.preventDefault();
		if (isLocked) return;

		const dataStr = e.dataTransfer?.getData('application/json');
		if (!dataStr) return;

		const brick = JSON.parse(dataStr) as {
			blockType: string;
			necessityBlockId: number | null;
			count?: number;
		};
		const count = brick.count || 1;

		let newAllocations = [...allocations];
		let currentHour = hour;

		// Place multiple bricks consecutively
		for (let i = 0; i < count && currentHour < 23; i++) {
			// Remove existing allocation at this slot
			newAllocations = newAllocations.filter(
				(a: Allocation) => !(a.dayOfWeek === dayIndex && a.hourSlot === currentHour)
			);

			newAllocations.push({
				blockType: brick.blockType,
				necessityBlockId: brick.necessityBlockId,
				dayOfWeek: dayIndex,
				hourSlot: currentHour
			});

			currentHour++;
		}

		allocations = newAllocations;
		submitSchedule();
	}

	function removeAllocation(dayIndex: number, hour: number) {
		if (isLocked) return;

		allocations = allocations.filter(
			(a: Allocation) => !(a.dayOfWeek === dayIndex && a.hourSlot === hour)
		);
		submitSchedule();
	}

	function clearAllAllocations() {
		if (isLocked) return;
		allocations = [];
		submitSchedule();
	}

	let scheduleForm: HTMLFormElement;
	function submitSchedule() {
		setTimeout(() => {
			scheduleForm?.requestSubmit();
		}, 0);
	}

	// Objective helpers
	function getObjectivesByCategory(category: string) {
		return data.objectives.filter((o) => o.category === category);
	}
</script>

<div class="container mx-auto min-h-screen p-8 space-y-8">
	<header class="flex flex-col items-center gap-4">
		<img
			src="/images/MEMENTO%20MORI.png"
			alt="Memento Mori"
			class="h-32 md:h-48 object-contain rounded-2xl"
		/>

		{#if data.deathClock}
			<div class="text-center space-y-2">
				<div class="text-lg md:text-2xl font-bold font-mono">
					{Math.floor(timeRemaining).toLocaleString()} Hours Left
				</div>
				<p class="text-xl text-surface-600-400-token">Focus on what matters</p>
			</div>

			<div class="w-full max-w-md">
				<Accordion collapsible>
					<Accordion.Item value="settings">
						<Accordion.ItemTrigger
							class="group flex items-center justify-between gap-2 w-full cursor-pointer py-2 px-4 rounded-token hover:bg-surface-500/10 transition-colors"
						>
							Settings
							<Accordion.ItemIndicator>
								<ChevronDown
									class="h-5 w-5 transition-transform duration-300 group-data-[state=open]:rotate-180"
								/>
							</Accordion.ItemIndicator>
						</Accordion.ItemTrigger>
						<Accordion.ItemContent>
							<form
								method="POST"
								action="?/updateSettings"
								use:enhance={() => {
									return async ({ update }) => {
										await update({ reset: false });
									};
								}}
								class="space-y-4 p-4"
							>
								<label class="label">
									<span>Date of Birth</span>
									<input
										class="input"
										type="date"
										name="birthDate"
										value={data.deathClock.birthDate}
										required
									/>
								</label>
								<label class="label">
									<span>Expected Lifespan</span>
									<input
										class="input"
										type="number"
										name="lifespan"
										value={data.deathClock.lifespan}
										required
									/>
								</label>
								<button type="submit" class="btn preset-filled w-full"> Save Settings </button>
							</form>
						</Accordion.ItemContent>
					</Accordion.Item>
				</Accordion>
			</div>

			{#if displayedAffirmation}
				<div class="flex flex-col items-center gap-2">
					<div class="text-center max-w-2xl mx-auto italic text-surface-600-400-token">
						"{displayedAffirmation}"
					</div>
					<div class="flex items-center gap-2">
						<a href="/affirmations" class="btn variant-soft-surface btn-sm">
							Manage Affirmations
						</a>
					</div>
					{#if affirmations.length > 1}
						<div class="flex items-center gap-2 mt-1">
							<button
								class="btn variant-ghost-surface btn-sm"
								onclick={prevAffirmation}
								aria-label="Previous affirmation"
							>
								Previous
							</button>
							<button
								class="btn variant-ghost-surface btn-sm"
								onclick={nextAffirmation}
								aria-label="Next affirmation"
							>
								Next
							</button>
						</div>
					{/if}
				</div>
			{/if}
		{/if}
	</header>

	<!-- PRIMARY FOCUS SECTION -->
	<section class="space-y-4">
		<div class="text-center">
			<div class="flex items-center justify-center gap-2">
				<h3 class="h3 font-bold" style="color: {data.purposeColor}">Primary Focus:</h3>
				{#if data.deathClock?.purposeLabel}
					<span class="h3 text-surface-400">- {data.deathClock.purposeLabel}</span>
				{/if}
			</div>
			<form
				method="POST"
				action="?/updatePurposeLabel"
				use:enhance={() => {
					return async ({ update }) => {
						editingPurposeLabel = false;
						await update({ reset: false });
					};
				}}
				class="mt-2 flex items-center justify-center gap-2"
			>
				{#if editingPurposeLabel}
					<!-- svelte-ignore a11y_autofocus -->
					<input
						class="input w-48"
						type="text"
						name="purposeLabel"
						bind:value={purposeLabelInput}
						placeholder="e.g., My Business"
						autofocus
					/>
					<button type="submit" class="btn variant-soft-primary btn-sm">Save</button>
					<button
						type="button"
						class="btn variant-soft-surface btn-sm"
						onclick={() => (editingPurposeLabel = false)}>Cancel</button
					>
				{:else}
					<button
						type="button"
						class="btn variant-ghost-surface btn-sm"
						onclick={() => (editingPurposeLabel = true)}
					>
						{data.deathClock?.purposeLabel ? 'Edit Label' : 'Add Label'}
					</button>
				{/if}
			</form>
		</div>
	</section>

	<!-- OBJECTIVES - 3 Column Layout -->
	<section class="grid grid-cols-1 md:grid-cols-3 gap-4">
		<!-- Long-term Purpose Objectives -->
		<div class="card p-4 border-2 rounded-xl" style="border-color: {data.purposeColor}">
			<div class="mb-3">
				<h4 class="h5 font-bold">Long-term Objectives</h4>
			</div>
			<div class="space-y-2">
				{#each getObjectivesByCategory('long-term-purpose') as objective (objective.id)}
					<div class="flex items-center gap-1">
						<form
							method="POST"
							action="?/updateObjective"
							use:enhance={() => {
								return async ({ update }) => {
									await update({ reset: false });
								};
							}}
						>
							<input type="hidden" name="id" value={objective.id} />
							<button
								name="isCompleted"
								value={(!objective.isCompleted).toString()}
								class="btn-icon btn-icon-sm hover:bg-surface-500/20 transition-colors rounded-full p-1"
							>
								{#if objective.isCompleted}
									<SquareCheck class="w-4 h-4 text-success-500" />
								{:else}
									<Square class="w-4 h-4 text-surface-400" />
								{/if}
							</button>
						</form>
						<form method="POST" action="?/updateObjective" use:enhance class="flex-1">
							<input type="hidden" name="id" value={objective.id} />
							<textarea
								class="textarea p-1 text-sm w-full rounded-md border-transparent focus:border-primary-500 focus:ring-0 resize-none min-h-6 {objective.isCompleted
									? 'bg-success-500/30'
									: 'bg-surface-500/10'}"
								name="text"
								rows="2"
								placeholder="Long-term objective..."
								onchange={(e) => e.currentTarget.form?.requestSubmit()}>{objective.text}</textarea
							>
						</form>
						<form method="POST" action="?/deleteObjective" use:enhance>
							<input type="hidden" name="id" value={objective.id} />
							<button
								class="btn-icon btn-icon-sm hover:bg-error-500/20 text-error-500 transition-colors rounded-full p-0.5"
							>
								<Trash2 class="w-3 h-3" />
							</button>
						</form>
					</div>
				{/each}

				{#if getObjectivesByCategory('long-term-purpose').length < 3}
					<form method="POST" action="?/addObjective" use:enhance class="pt-1">
						<input type="hidden" name="category" value="long-term-purpose" />
						<button
							class="btn variant-soft-primary w-full flex items-center justify-center gap-1 py-1 text-xs rounded-md hover:bg-primary-500/20 transition-colors"
						>
							<Plus class="w-3 h-3" />
							<span>Add ({getObjectivesByCategory('long-term-purpose').length}/3)</span>
						</button>
					</form>
				{/if}
			</div>
			<form method="POST" action="?/clearObjectives" use:enhance class="mt-3 flex justify-end">
				<input type="hidden" name="category" value="long-term-purpose" />
				<button class="btn variant-ghost-warning btn-sm text-xs flex items-center gap-1 py-1 px-2">
					<Eraser class="w-3 h-3" /> Clear
				</button>
			</form>
		</div>

		<!-- Weekly Purpose Objectives -->
		<div class="card p-4 border rounded-xl" style="border-color: {data.purposeColor}40">
			<div class="mb-3">
				<h4 class="h5 font-bold">Weekly Objectives</h4>
				<span class="text-xs text-surface-400">Clear weekly</span>
			</div>
			<div class="space-y-2">
				{#each getObjectivesByCategory('weekly-purpose') as objective (objective.id)}
					<div class="flex items-center gap-1">
						<form
							method="POST"
							action="?/updateObjective"
							use:enhance={() => {
								return async ({ update }) => {
									await update({ reset: false });
								};
							}}
						>
							<input type="hidden" name="id" value={objective.id} />
							<button
								name="isCompleted"
								value={(!objective.isCompleted).toString()}
								class="btn-icon btn-icon-sm hover:bg-surface-500/20 transition-colors rounded-full p-1"
							>
								{#if objective.isCompleted}
									<SquareCheck class="w-4 h-4 text-success-500" />
								{:else}
									<Square class="w-4 h-4 text-surface-400" />
								{/if}
							</button>
						</form>
						<form method="POST" action="?/updateObjective" use:enhance class="flex-1">
							<input type="hidden" name="id" value={objective.id} />
							<textarea
								class="textarea p-1 text-sm w-full rounded-md border-transparent focus:border-primary-500 focus:ring-0 resize-none min-h-6 {objective.isCompleted
									? 'bg-success-500/30'
									: 'bg-surface-500/10'}"
								name="text"
								rows="2"
								placeholder="Weekly purpose objective..."
								onchange={(e) => e.currentTarget.form?.requestSubmit()}>{objective.text}</textarea
							>
						</form>
						<form method="POST" action="?/deleteObjective" use:enhance>
							<input type="hidden" name="id" value={objective.id} />
							<button
								class="btn-icon btn-icon-sm hover:bg-error-500/20 text-error-500 transition-colors rounded-full p-0.5"
							>
								<Trash2 class="w-3 h-3" />
							</button>
						</form>
					</div>
				{/each}

				{#if getObjectivesByCategory('weekly-purpose').length < 3}
					<form method="POST" action="?/addObjective" use:enhance class="pt-1">
						<input type="hidden" name="category" value="weekly-purpose" />
						<button
							class="btn variant-soft-primary w-full flex items-center justify-center gap-1 py-1 text-xs rounded-md hover:bg-primary-500/20 transition-colors"
						>
							<Plus class="w-3 h-3" />
							<span>Add ({getObjectivesByCategory('weekly-purpose').length}/3)</span>
						</button>
					</form>
				{/if}
			</div>
			<form method="POST" action="?/clearObjectives" use:enhance class="mt-3 flex justify-end">
				<input type="hidden" name="category" value="weekly-purpose" />
				<button class="btn variant-ghost-warning btn-sm text-xs flex items-center gap-1 py-1 px-2">
					<Eraser class="w-3 h-3" /> Clear
				</button>
			</form>
		</div>

		<!-- Weekly Necessity Objectives -->
		<div class="card p-4 border rounded-xl border-surface-500/30">
			<div class="mb-3">
				<h4 class="h5 font-bold text-surface-400">Weekly Necessities</h4>
				<span class="text-xs text-surface-400">Clear weekly</span>
			</div>
			<div class="space-y-2">
				{#each getObjectivesByCategory('weekly-necessity') as objective (objective.id)}
					<div class="flex items-center gap-1">
						<form
							method="POST"
							action="?/updateObjective"
							use:enhance={() => {
								return async ({ update }) => {
									await update({ reset: false });
								};
							}}
						>
							<input type="hidden" name="id" value={objective.id} />
							<button
								name="isCompleted"
								value={(!objective.isCompleted).toString()}
								class="btn-icon btn-icon-sm hover:bg-surface-500/20 transition-colors rounded-full p-1"
							>
								{#if objective.isCompleted}
									<SquareCheck class="w-4 h-4 text-success-500" />
								{:else}
									<Square class="w-4 h-4 text-surface-400" />
								{/if}
							</button>
						</form>
						<form method="POST" action="?/updateObjective" use:enhance class="flex-1">
							<input type="hidden" name="id" value={objective.id} />
							<textarea
								class="textarea p-1 text-sm w-full rounded-md border-transparent focus:border-primary-500 focus:ring-0 resize-none min-h-6 {objective.isCompleted
									? 'bg-success-500/30'
									: 'bg-surface-500/10'}"
								name="text"
								rows="2"
								placeholder="Weekly necessity objective..."
								onchange={(e) => e.currentTarget.form?.requestSubmit()}>{objective.text}</textarea
							>
						</form>
						<form method="POST" action="?/deleteObjective" use:enhance>
							<input type="hidden" name="id" value={objective.id} />
							<button
								class="btn-icon btn-icon-sm hover:bg-error-500/20 text-error-500 transition-colors rounded-full p-0.5"
							>
								<Trash2 class="w-3 h-3" />
							</button>
						</form>
					</div>
				{/each}

				{#if getObjectivesByCategory('weekly-necessity').length < 2}
					<form method="POST" action="?/addObjective" use:enhance class="pt-1">
						<input type="hidden" name="category" value="weekly-necessity" />
						<button
							class="btn variant-soft-surface w-full flex items-center justify-center gap-1 py-1 text-xs rounded-md hover:bg-surface-500/20 transition-colors"
						>
							<Plus class="w-3 h-3" />
							<span>Add ({getObjectivesByCategory('weekly-necessity').length}/2)</span>
						</button>
					</form>
				{/if}
			</div>
			<form method="POST" action="?/clearObjectives" use:enhance class="mt-3 flex justify-end">
				<input type="hidden" name="category" value="weekly-necessity" />
				<button class="btn variant-ghost-warning btn-sm text-xs flex items-center gap-1 py-1 px-2">
					<Eraser class="w-3 h-3" /> Clear
				</button>
			</form>
		</div>
	</section>

	<!-- BLOCK BANK SECTION -->
	<div class="w-full">
		<Accordion collapsible>
			<Accordion.Item value="block-bank">
				<Accordion.ItemTrigger
					class="group flex items-center justify-between gap-2 w-full cursor-pointer py-2 px-4 rounded-token hover:bg-surface-500/10 transition-colors"
				>
					<h4 class="h4 font-bold">Block Bank</h4>
					<Accordion.ItemIndicator>
						<ChevronDown
							class="h-5 w-5 transition-transform duration-300 group-data-[state=open]:rotate-180"
						/>
					</Accordion.ItemIndicator>
				</Accordion.ItemTrigger>
				<Accordion.ItemContent>
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<div
						class="flex flex-wrap gap-6 p-4 bg-surface-500/5 rounded-lg border border-surface-500/30"
						onclick={(e) => {
							if (e.target === e.currentTarget) clearSelection();
						}}
						role="toolbar"
						aria-label="Block selection"
						tabindex="-1"
					>
						<!-- Primary Focus Block -->
						<div class="flex items-center gap-3 relative">
							<button
								class="w-12 h-12 rounded cursor-move border-2 transition-all hover:scale-110"
								class:border-white={isSelected('purpose', null)}
								class:border-transparent={!isSelected('purpose', null)}
								style="background-color: {data.purposeColor}"
								draggable="true"
								onclick={() => selectBrick('purpose', null)}
								ondragstart={(e) => handleDragStart(e, 'purpose', null)}
								ondragend={handleDragEnd}
								aria-label="Drag primary focus brick"
							></button>
							{#if isSelected('purpose', null) && selectedCount > 0}
								<span
									class="absolute -top-2 -right-2 bg-white text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
								>
									{selectedCount}
								</span>
							{/if}
							<span class="font-bold text-sm" style="color: {data.purposeColor}">
								{data.deathClock?.purposeLabel || 'Primary Focus'}
							</span>
						</div>

						<!-- Necessity Blocks -->
						{#each data.necessityBlocks as block (block.id)}
							<div class="flex items-center gap-3 relative">
								<button
									class="w-12 h-12 rounded cursor-move border-2 transition-all hover:scale-110"
									class:border-white={isSelected('necessity', block.id)}
									class:border-transparent={!isSelected('necessity', block.id)}
									style="background-color: {block.color}"
									draggable="true"
									onclick={() => selectBrick('necessity', block.id)}
									ondragstart={(e) => handleDragStart(e, 'necessity', block.id)}
									ondragend={handleDragEnd}
									aria-label="Drag {block.name} brick"
								></button>
								{#if isSelected('necessity', block.id) && selectedCount > 0}
									<span
										class="absolute -top-2 -right-2 bg-white text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
									>
										{selectedCount}
									</span>
								{/if}
								<span class="font-bold text-sm" style="color: {block.color}">{block.name}</span>
							</div>
						{/each}
					</div>

					<!-- Block Settings -->
					<Accordion collapsible class="mt-4">
						<Accordion.Item value="block-settings">
							<Accordion.ItemTrigger
								class="group flex items-center justify-between gap-2 w-full cursor-pointer py-2 px-4 rounded-token hover:bg-surface-500/10 transition-colors"
							>
								<span class="text-sm text-surface-400">Manage Blocks</span>
								<Accordion.ItemIndicator>
									<ChevronDown
										class="h-4 w-4 transition-transform duration-300 group-data-[state=open]:rotate-180"
									/>
								</Accordion.ItemIndicator>
							</Accordion.ItemTrigger>
							<Accordion.ItemContent>
								<div class="p-4 space-y-4">
									<!-- Existing blocks -->
									<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
										{#each data.necessityBlocks as block (block.id)}
											<div class="flex items-center gap-2 bg-surface-500/10 rounded-lg p-3">
												<div
													class="w-8 h-8 rounded flex-shrink-0"
													style="background-color: {block.color}"
												></div>
												<form
													method="POST"
													action="?/updateNecessityBlock"
													use:enhance={() => {
														return async ({ update }) => {
															await update({ reset: false });
														};
													}}
													class="flex-1"
												>
													<input type="hidden" name="id" value={block.id} />
													<input
														class="input w-full"
														type="text"
														name="name"
														value={block.name}
														onchange={(e) => e.currentTarget.form?.requestSubmit()}
													/>
												</form>
												<form method="POST" action="?/deleteNecessityBlock" use:enhance>
													<input type="hidden" name="id" value={block.id} />
													<button
														type="submit"
														class="btn btn-sm preset-filled-error-500 p-2"
														aria-label="Delete {block.name} block"
													>
														<Trash2 class="w-4 h-4" />
													</button>
												</form>
											</div>
										{/each}
									</div>

									<!-- Add new block form -->
									<form
										method="POST"
										action="?/addNecessityBlock"
										use:enhance
										class="flex items-center gap-3 p-3 border border-dashed border-surface-500/30 rounded-lg"
									>
										<input
											type="color"
											name="color"
											value="#6b7280"
											class="w-8 h-8 rounded cursor-pointer"
										/>
										<input
											class="input flex-1"
											type="text"
											name="name"
											placeholder="New block name..."
											required
										/>
										<button type="submit" class="btn preset-filled-primary-500">
											<Plus class="w-4 h-4" />
											<span>Add Block</span>
										</button>
									</form>
								</div>
							</Accordion.ItemContent>
						</Accordion.Item>
					</Accordion>
				</Accordion.ItemContent>
			</Accordion.Item>
		</Accordion>
	</div>

	<!-- WEEKLY SCHEDULE SECTION -->
	<div class="w-full">
		<Accordion collapsible>
			<Accordion.Item value="weekly-schedule">
				<Accordion.ItemTrigger
					class="group flex items-center justify-between gap-2 w-full cursor-pointer py-2 px-4 rounded-token hover:bg-surface-500/10 transition-colors"
				>
					<h4 class="h4 font-bold">Weekly Schedule</h4>
					<Accordion.ItemIndicator>
						<ChevronDown
							class="h-5 w-5 transition-transform duration-300 group-data-[state=open]:rotate-180"
						/>
					</Accordion.ItemIndicator>
				</Accordion.ItemTrigger>
				<Accordion.ItemContent>
					<div class="grid grid-cols-[auto_repeat(7,1fr)] gap-2 overflow-x-auto min-w-200 p-4">
						<div class="col-span-1"></div>
						{#each days as day}
							<div class="text-center font-bold p-2">{day}</div>
						{/each}

						{#each hours as hour}
							<div class="text-right pr-2 text-sm text-surface-400 pt-2">{hour}:00</div>
							{#each days as day, dayIndex}
								{@const allocation = allocations.find(
									(a: Allocation) => a.dayOfWeek === dayIndex && a.hourSlot === hour
								)}
								{@const blockInfo = allocation ? getBlockInfo(allocation) : null}
								<div
									class="h-10 border border-surface-500/20 rounded relative transition-colors hover:bg-surface-500/5"
									ondragover={handleDragOver}
									ondrop={(e) => handleDrop(e, dayIndex, hour)}
									role="gridcell"
									tabindex="0"
								>
									{#if blockInfo}
										<button
											class="absolute inset-0 rounded opacity-80 flex items-center justify-center text-xs font-bold text-white truncate px-1 w-full h-full"
											style="background-color: {blockInfo.color}"
											onclick={() => removeAllocation(dayIndex, hour)}
											title="Click to remove"
										>
											{blockInfo.name}
										</button>
									{/if}
								</div>
							{/each}
						{/each}
					</div>
					<div class="flex justify-end gap-2 pt-2">
						<button
							class="btn preset-filled-surface-500 flex items-center gap-2"
							onclick={clearAllAllocations}
							disabled={isLocked}
						>
							<Eraser class="w-4 h-4" />
							<span class="text-sm font-bold">Clear All</span>
						</button>
						<button
							class="btn {isLocked
								? 'variant-filled-error'
								: 'variant-filled-success'} flex items-center gap-2 transition-all"
							onclick={() => (isLocked = !isLocked)}
						>
							<span class="text-sm font-bold"
								>{isLocked ? 'Schedule Locked' : 'Schedule Unlocked'}</span
							>
							{#if isLocked}
								<Lock class="w-4 h-4" />
							{:else}
								<LockOpen class="w-4 h-4" />
							{/if}
						</button>
					</div>
				</Accordion.ItemContent>
			</Accordion.Item>
		</Accordion>
	</div>

	<form method="POST" action="?/updateSchedule" use:enhance bind:this={scheduleForm} class="hidden">
		<input type="hidden" name="allocations" value={JSON.stringify(allocations)} />
	</form>
</div>
