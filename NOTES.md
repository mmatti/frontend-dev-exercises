## Notes on the Exercise

Interesting project: seemed simple at first, but that didn't last long ...

### Technical details

- Visualizations can be loaded from:
  - educ.html
  - race.html
  - combo.html
- Any of those files, once rendered, has links to the other two.
- Supporting Jade, SCSS, CSS, and JS files can be found in child directories.
- There is only one library dependency: D3 v4, which is pulled in from the d3js.org site.

### Chart type

- With discrete values on one axis and a calculated mean on the other, bar charts seemed the way to go. (Your instructions said "don't overthink it").
- Earned-50K averages were the only Y value series, but the instructions were explicit about showing percentages ***both*** above and below that threshold. This presented a challenge: how to clearly display the two values per category in a mutually-reenforcing, rather than distracting/competing way.
- My solution was to double the Y axis, with 0 as the midpoint and earned-50K extending above and not-earned-50K below. Bar heights are always 100%, but they "float" at different levels along a mirrored, 200% axis.
- To help clarify that above and below are two dimensions of the same value, the not-earned-50K portion of the bars use a washed-out version of the same color used on the earned-50K portion. This is clearer (I think) than using the same color across the bar and tinting the bottom half of the background.

### Series order

- Education and race might contain discrete values, but they both have ordinal aspects. With education it's obvious, with never-graduated at one end and professional degrees at the other. Of course, the census file didn't come that way.
- Race values are nominal, but there's a convention to list them from majority to minority groups, with "other" or "not specified" tacked on at the end. I followed that convention; to do otherwise could be confusing/distracting.

### Miscellaneous

- Color-blind palette for the combo graph.
- Subtle (I hope) animation reinforces the above/below aspect of the earned-50K split.
- Nearly panicked when I saw ***no*** "amer-indian-eskimo" or "other" citizens with professional degrees earning less than 50K. Went back and examined that census file. It's true!
- Q: Why race within education categories, instead of the other way around on the combo chart?
  A: Better to glance back and forth to five legend labels than eight.