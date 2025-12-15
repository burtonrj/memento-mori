<script lang="ts">
	import { ChevronDown, Plus, Trash2, SquareCheck, Square, Lock, LockOpen } from 'lucide-svelte';
	import { Accordion } from '@skeletonlabs/skeleton-svelte';
	import { enhance } from '$app/forms';

	let { data } = $props();
	const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
	const hours = Array.from({ length: 16 }, (_, i) => i + 7);

	// State
	type Allocation = {
		id?: number;
		blockId: number;
		dayOfWeek: number;
		hourSlot: number;
		weekStartDate: string;
	};

	// svelte-ignore state_referenced_locally
		let allocations = $state<Allocation[]>(data.allocations || []);
	let selectedBricks = $state<{ blockId: number; id: string }[]>([]);
	let isLocked = $state(true);

	$effect(() => {
		allocations = data.allocations || [];
	});

	// Derived
	let allocatedCounts = $derived(
		allocations.reduce((acc: Record<number, number>, a: Allocation) => {
			acc[a.blockId] = (acc[a.blockId] || 0) + 1;
			return acc;
		}, {})
	);

	// Drag and Drop
	function handleDragStart(e: DragEvent, blockId: number, brickId: string) {
		if (isLocked) {
			e.preventDefault();
			return;
		}

		if (!selectedBricks.find((b) => b.id === brickId)) {
			selectedBricks = [{ blockId, id: brickId }];
		}

		e.dataTransfer?.setData('application/json', JSON.stringify(selectedBricks));
		e.dataTransfer!.effectAllowed = 'move';
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		e.dataTransfer!.dropEffect = 'move';
	}

	function handleDrop(e: DragEvent, dayIndex: number, hour: number) {
		e.preventDefault();
		if (isLocked) return;

		const dataStr = e.dataTransfer?.getData('application/json');
		if (!dataStr) return;

		const droppedBricks = JSON.parse(dataStr) as { blockId: number; id: string }[];

		let currentHour = hour;
		let newAllocations = [...allocations];

		for (const brick of droppedBricks) {
			if (currentHour >= 24) break;

			// Remove existing allocation at this slot
			newAllocations = newAllocations.filter(
				(a: Allocation) => !(a.dayOfWeek === dayIndex && a.hourSlot === currentHour)
			);

			newAllocations.push({
				blockId: brick.blockId,
				dayOfWeek: dayIndex,
				hourSlot: currentHour,
				weekStartDate: data.weekStartDate
			});

			currentHour++;
		}

		allocations = newAllocations;
		selectedBricks = [];
		submitSchedule();
	}

	function removeAllocation(dayIndex: number, hour: number) {
		if (isLocked) return;

		allocations = allocations.filter(
			(a: Allocation) => !(a.dayOfWeek === dayIndex && a.hourSlot === hour)
		);
		submitSchedule();
	}

	let scheduleForm: HTMLFormElement;
	function submitSchedule() {
		setTimeout(() => {
			scheduleForm?.requestSubmit();
		}, 0);
	}

	function toggleSelection(blockId: number, brickId: string) {
		const index = selectedBricks.findIndex((b) => b.id === brickId);
		if (index >= 0) {
			selectedBricks = selectedBricks.filter((b) => b.id !== brickId);
		} else {
			selectedBricks = [...selectedBricks, { blockId, id: brickId }];
		}
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
					{data.deathClock.hoursLeft.toLocaleString()} Hours Left
				</div>
				<p class="text-xl text-surface-600-400-token">Let's make the most of it</p>
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
									<span>Current Age</span>
									<input
										class="input"
										type="number"
										name="age"
										value={data.deathClock.age}
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

			{#if data.affirmation}
				<div class="flex flex-col items-center gap-2">
					<div class="text-center max-w-2xl mx-auto italic text-surface-600-400-token">
						"{data.affirmation}"
					</div>
					<a href="/affirmations" class="btn variant-soft-surface btn-sm"> Manage Affirmations </a>
				</div>
			{/if}
		{/if}
	</header>

	{#if data.blocks}
		<Accordion collapsible>
			<Accordion.Item value="objectives">
				<Accordion.ItemTrigger
					class="group flex items-center justify-between gap-2 w-full cursor-pointer py-2 px-4 rounded-token hover:bg-surface-500/10 transition-colors"
				>
					<h2 class="h3">Objectives</h2>
					<Accordion.ItemIndicator>
						<ChevronDown
							class="h-5 w-5 transition-transform duration-300 group-data-[state=open]:rotate-180"
						/>
					</Accordion.ItemIndicator>
				</Accordion.ItemTrigger>
				<Accordion.ItemContent>
					<section class="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
						{#each data.blocks as block (block.id)}
							{@const blockObjectives = data.objectives.filter((o) => o.blockId === block.id)}
							<div
								class="card p-4 space-y-4 border border-surface-500/30 rounded-lg bg-surface-500/5"
							>
								<h3 class="h4 text-center tracking-widest">{block.name}</h3>
								<div class="space-y-2">
									{#each blockObjectives as objective (objective.id)}
										<div class="flex items-center gap-2">
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
														<SquareCheck class="w-5 h-5 text-success-500" />
													{:else}
														<Square class="w-5 h-5 text-surface-400" />
													{/if}
												</button>
											</form>
											<form method="POST" action="?/updateObjective" use:enhance class="flex-1">
												<input type="hidden" name="id" value={objective.id} />
												<textarea
													class="textarea p-2 w-full rounded-md border-transparent focus:border-primary-500 focus:ring-0 resize-none min-h-6 {objective.isCompleted
														? 'bg-[#39a355]'
														: 'bg-surface-500/10'}"
													name="text"
													rows="2"
													placeholder="Objective..."
													onchange={(e) => e.currentTarget.form?.requestSubmit()}
													>{objective.text}</textarea
												>
											</form>
											<form method="POST" action="?/deleteObjective" use:enhance>
												<input type="hidden" name="id" value={objective.id} />
												<button
													class="btn-icon btn-icon-sm hover:bg-error-500/20 text-error-500 transition-colors rounded-full p-1"
												>
													<Trash2 class="w-4 h-4" />
												</button>
											</form>
										</div>
									{/each}

									{#if blockObjectives.length < 2}
										<form
											method="POST"
											action="?/addObjective"
											use:enhance
											class="flex justify-center pt-2"
										>
											<input type="hidden" name="blockId" value={block.id} />
											<input type="hidden" name="weekStartDate" value={data.weekStartDate} />
											<button
												class="btn variant-soft-primary w-full flex items-center justify-center gap-2 py-2 rounded-md hover:bg-primary-500/20 transition-colors"
											>
												<Plus class="w-4 h-4" /> <span>Add Objective</span>
											</button>
										</form>
									{/if}
								</div>
							</div>
						{/each}
					</section>
				</Accordion.ItemContent>
			</Accordion.Item>
		</Accordion>
	{/if}
	<div class="w-full">
		<Accordion collapsible>
			<Accordion.Item value="block-bank">
				<Accordion.ItemTrigger
					class="group flex items-center justify-between gap-2 w-full cursor-pointer py-2 px-4 rounded-token hover:bg-surface-500/10 transition-colors"
				>
					<h2 class="h3 font-bol">Block Bank</h2>
					<Accordion.ItemIndicator>
						<ChevronDown
							class="h-5 w-5 transition-transform duration-300 group-data-[state=open]:rotate-180"
						/>
					</Accordion.ItemIndicator>
				</Accordion.ItemTrigger>
				<Accordion.ItemContent>
					<div
						class="flex flex-col gap-4 p-4 bg-surface-500/5 rounded-lg border border-surface-500/30"
					>
						{#each data.blocks as block (block.id)}
							{@const count = block.timeAllocation - (allocatedCounts[block.id] || 0)}
							<div class="flex flex-col md:flex-row gap-4 items-start md:items-center">
								<div class="w-32 font-bold shrink-0" style="color: {block.color}">{block.name}</div>
								<div class="flex flex-wrap gap-1">
									{#each Array(Math.max(0, count)) as _, i}
										{@const brickId = `${block.id}-brick-${i}`}
										{@const isSelected = selectedBricks.some((b) => b.id === brickId)}
										<button
											class="w-8 h-8 rounded cursor-move border-2 transition-all hover:scale-110"
											style="background-color: {block.color}; border-color: {isSelected
												? 'white'
												: 'transparent'}; opacity: {isSelected ? 0.8 : 1}"
											draggable="true"
											ondragstart={(e) => handleDragStart(e, block.id, brickId)}
											onclick={() => toggleSelection(block.id, brickId)}
											aria-label="Drag brick"
										></button>
									{/each}
								</div>
							</div>
						{/each}
					</div>
					<div class="w-full mt-4">
						<Accordion collapsible>
							<Accordion.Item value="block-settings">
								<Accordion.ItemTrigger
									class="group flex items-center justify-between gap-2 w-full cursor-pointer py-2 px-4 rounded-token hover:bg-surface-500/10 transition-colors"
								>
									<span class="font-bold">Block Settings</span>
									<Accordion.ItemIndicator>
										<ChevronDown
											class="h-5 w-5 transition-transform duration-300 group-data-[state=open]:rotate-180"
										/>
									</Accordion.ItemIndicator>
								</Accordion.ItemTrigger>
								<Accordion.ItemContent>
									<div
										class="p-4 space-y-8 bg-surface-500/5 rounded-b-lg border-x border-b border-surface-500/30"
									>
										<!-- Block List -->
										<div class="space-y-4">
											<h3 class="font-bold">Edit Blocks</h3>
											<div class="grid gap-4">
												{#each data.blocks as block (block.id)}
													<form
														method="POST"
														action="?/updateBlock"
														use:enhance={() => {
															return async ({ update }) => {
																await update({ reset: false });
															};
														}}
														class="flex flex-col md:flex-row gap-2 items-end p-2 rounded hover:bg-surface-500/10 transition-colors"
													>
														<input type="hidden" name="id" value={block.id} />
														<div
															class="w-8 h-8 rounded shrink-0 mb-2 md:mb-0 self-center md:self-end"
															style="background-color: {block.color}"
														></div>
														<label class="label flex-1 w-full">
															<span class="md:hidden">Name</span>
															<input
																class="input"
																type="text"
																name="name"
																value={block.name}
																placeholder="Block Name"
															/>
														</label>
														<label class="label w-full md:w-32">
															<span class="md:hidden">Hours</span>
															<input
																class="input"
																type="number"
																name="timeAllocation"
																value={block.timeAllocation}
																placeholder="Hours"
															/>
														</label>
														<button class="btn variant-soft-secondary w-full md:w-auto">Save</button
														>
													</form>
												{/each}
											</div>
										</div>
									</div>
								</Accordion.ItemContent>
							</Accordion.Item>
						</Accordion>
					</div>
				</Accordion.ItemContent>
			</Accordion.Item>
		</Accordion>
	</div>

	<div class="w-full">
		<Accordion collapsible>
			<Accordion.Item value="weekly-schedule">
				<Accordion.ItemTrigger
					class="group flex items-center justify-between gap-2 w-full cursor-pointer py-2 px-4 rounded-token hover:bg-surface-500/10 transition-colors"
				>
					<h2 class="h3">Weekly Schedule</h2>
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
								{@const block = allocation
									? data.blocks.find((b) => b.id === allocation.blockId)
									: null}
								<div
									class="h-10 border border-surface-500/20 rounded relative transition-colors hover:bg-surface-500/5"
									ondragover={handleDragOver}
									ondrop={(e) => handleDrop(e, dayIndex, hour)}
									role="gridcell"
									tabindex="0"
								>
									{#if block}
										<button
											class="absolute inset-0 rounded opacity-80 flex items-center justify-center text-xs font-bold text-white truncate px-1 w-full h-full"
											style="background-color: {block.color}"
											onclick={() => removeAllocation(dayIndex, hour)}
											title="Click to remove"
										>
											{block.name}
										</button>
									{/if}
								</div>
							{/each}
						{/each}
					</div>
					<div class="flex justify-end pt-2">
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
		<input type="hidden" name="weekStartDate" value={data.weekStartDate} />
		<input type="hidden" name="allocations" value={JSON.stringify(allocations)} />
	</form>
</div>
