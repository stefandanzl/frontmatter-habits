import {Plugin} from 'obsidian'
import HabitTracker from './tracker'

const PLUGIN_NAME = 'Frontmatter Habits'

export default class HabitTracker21 extends Plugin {
	async onload() {
		console.log(`${PLUGIN_NAME}: loading...`)
		this.registerMarkdownCodeBlockProcessor(
			'habittracker',
			async (src, el, ctx) => {
				new HabitTracker(src, el, ctx, this.app)
			},
		)
	}
}
