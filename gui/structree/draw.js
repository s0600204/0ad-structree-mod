var g_DrawLimits = {}; // GUI limits. Populated by predraw()

/**
 * Draw the structree
 *
 * (Actually resizes and changes visibility of elements, and populates text)
 */
function draw()
{
	// Set basic state (positioning of elements mainly), but only once
	if (!Object.keys(g_DrawLimits).length)
		predraw();
	
	var defWidth = 112;
	var defMargin = 8;
	var iconMargin = getProdIconDimen().hMargin;
	var iconWidth = getProdIconDimen().width + iconMargin;
	var phaseList = g_ParsedData.phaseList;

	Engine.GetGUIObjectByName("civEmblem").sprite = "stretched:"+g_CivData[g_SelectedCiv].Emblem;
	Engine.GetGUIObjectByName("civName").caption = g_CivData[g_SelectedCiv].Name;
	Engine.GetGUIObjectByName("civHistory").caption = g_CivData[g_SelectedCiv].History;

	let i = 0;
	for (let pha of phaseList)
	{
		let s = 0;
		let y = 0;

		for (let stru of g_CivData[g_SelectedCiv].buildList[pha])
		{
			let thisEle = Engine.GetGUIObjectByName("phase["+i+"]_struct["+s+"]");
			if (thisEle === undefined)
			{
				error("\""+g_SelectedCiv+"\" has more structures in phase "+pha+" than can be supported by the current GUI layout");
				break;
			}

			let c = 0;
			let rowCounts = [];
			stru = g_ParsedData.structures[stru];
			Engine.GetGUIObjectByName("phase["+i+"]_struct["+s+"]_icon").sprite = "stretched:session/portraits/"+stru.icon;
			Engine.GetGUIObjectByName("phase["+i+"]_struct["+s+"]_icon").tooltip = assembleTooltip(stru);
			thisEle.hidden = false;

			for (let r in g_DrawLimits[pha].prodQuant)
			{
				let p = 0;
				r = +r; // force int
				let prod_pha = phaseList[phaseList.indexOf(pha) + r];
				if (stru.production.units[prod_pha])
				{
					for (let prod of stru.production.units[prod_pha])
					{
						prod = g_ParsedData.units[prod];
						if (!drawProdIcon(i, s, r, p, prod, "Blue"))
							break;
						p++;
					}
				}
				if (stru.wallset && prod_pha == pha)
				{
					for (let prod of [stru.wallset.gate, stru.wallset.tower])
					{
						if (!drawProdIcon(i, s, r, p, prod, "Green"))
							break;
						p++;
					}
				}
				if (stru.production.technology[prod_pha])
				{
					for (let prod of stru.production.technology[prod_pha])
					{
						prod = (depath(prod).slice(0,5) == "phase") ? g_ParsedData.phases[prod] : g_ParsedData.techs[prod];
						if (!drawProdIcon(i, s, r, p, prod, "Gold"))
							break;
						p++;
					}
				}
				rowCounts[r] = p;
				if (p>c)
					c = p;
				hideRemaining("phase["+i+"]_struct["+s+"]_row["+r+"]_prod[", p, "]");
			}

			let size = thisEle.size;
			size.left = y;
			size.right = y + ((c*iconWidth < defWidth)?defWidth:c*iconWidth)+iconMargin;
			y = size.right + defMargin;
			thisEle.size = size;

			let eleWidth = size.right - size.left;
			let r;
			for (r in rowCounts)
			{
				let wid = rowCounts[r] * iconWidth - iconMargin;
				let phaEle = Engine.GetGUIObjectByName("phase["+i+"]_struct["+s+"]_row["+r+"]");
				size = phaEle.size;
				size.left = (eleWidth - wid)/2;
				phaEle.size = size;
			}
			++r;
			hideRemaining("phase["+i+"]_struct["+s+"]_row[", r, "]");
			++s;
		}
		hideRemaining("phase["+i+"]_struct[", s, "]");
		++i;
	}
	
	var t = 0;
	for (let trainer of g_CivData[g_SelectedCiv].trainList)
	{
		let thisEle = Engine.GetGUIObjectByName("trainer["+t+"]");
		if (thisEle === undefined)
		{
			error("\""+g_SelectedCiv+"\" has more unit trainers than can be supported by the current GUI layout");
			break;
		}

		trainer = g_ParsedData.units[trainer];
		Engine.GetGUIObjectByName("trainer["+t+"]_icon").sprite = "stretched:session/portraits/"+trainer.icon;
		Engine.GetGUIObjectByName("trainer["+t+"]_icon").tooltip = assembleTooltip(trainer);
		thisEle.hidden = false;
		
		let p = 0;
		for (let prod of trainer.trainer)
		{
			prod = g_ParsedData.units[prod];
			if (!drawProdIcon(null, t, null, p, prod, "Blue"))
				break;
			p++;
		}
		hideRemaining("trainer["+t+"]_prod[", p, "]");

		let size = thisEle.size;
		size.right = size.left + ((p*24 < defWidth)?defWidth:p*24)+4;
		thisEle.size = size;

		let eleWidth = size.right - size.left;
		let wid = p * 24 - 4;
		let phaEle = Engine.GetGUIObjectByName("trainer["+t+"]_row");
		size = phaEle.size;
		size.left = (eleWidth - wid)/2;
		phaEle.size = size;
		++t;
	}
	hideRemaining("trainer[", t, "]");
	
	if (t > 0)
	{
		Engine.GetGUIObjectByName("display_trainers").hidden = false;
		var size = Engine.GetGUIObjectByName("display_tree").size;
		size.right = -138;
		Engine.GetGUIObjectByName("display_tree").size = size;
	}
	else
	{
		Engine.GetGUIObjectByName("display_trainers").hidden = true;
		var size = Engine.GetGUIObjectByName("display_tree").size;
		size.right = -4;
		Engine.GetGUIObjectByName("display_tree").size = size;
	}
}

function drawProdIcon(pha, s, r, p, prod, clr)
{
	var prodEle = Engine.GetGUIObjectByName("phase["+pha+"]_struct["+s+"]_row["+r+"]_prod["+p+"]");
	if (pha === null)
		prodEle = Engine.GetGUIObjectByName("trainer["+s+"]_prod["+p+"]");

	if (prodEle === undefined)
	{
		error("The "+(pha === null ? "trainer units" : "structures")+" of \""+g_SelectedCiv+"\" have more production icons than can be supported by the current GUI layout");
		return false;
	}

	prodEle.sprite = "stretched:session/portraits/"+prod.icon;
	prodEle.tooltip = assembleTooltip(prod);
	prodEle.hidden = false;

	if (pha !== null)
		Engine.GetGUIObjectByName("phase["+pha+"]_struct["+s+"]_row["+r+"]_prod["+p+"]_frame").sprite = "IconFrame_"+clr;
	else
		Engine.GetGUIObjectByName("trainer["+s+"]_prod["+p+"]_frame").sprite = "IconFrame_"+clr;
	return true;
}

/**
 * Calculate row position offset (accounting for different number of prod rows per phase).
 */
function getPositionOffset(idx)
{
	var phases = g_ParsedData.phaseList.length;

	var size = 92*idx; // text, image and offset
	size += (getProdIconDimen().adjWidth+8) * (phases*idx - (idx-1)*idx/2); // phase rows (phase-currphase+1 per row)

	return size;
}

function getProdIconDimen()
{
	var pIcon = Engine.GetGUIObjectByName("phase[0]_struct[0]_row[0]_prod[0]").size;
	pIcon.width = pIcon.right - pIcon.left;
	pIcon.height = pIcon.bottom - pIcon.top;
	pIcon.vMargin = pIcon.top;
	pIcon.hMargin = pIcon.left;
	pIcon.adjWidth = pIcon.width + pIcon.hMargin * 2;
	pIcon.adjHeight = pIcon.height + pIcon.vMargin * 2;
	return pIcon;
}

/**
 * Positions certain elements that only need to be positioned once
 * (as <repeat> does not reposition automatically).
 * 
 * Also detects limits on what the GUI can display by iterating through the set
 * elements of the GUI. These limits are then used by draw().
 */
function predraw()
{
	var phaseList = g_ParsedData.phaseList;
	var initIconSize = getProdIconDimen();

	let phaseCount = phaseList.length;
	let i = 0;
	for (let pha of phaseList)
	{
		let offset = getPositionOffset(i);
		// Align the phase row
		Engine.GetGUIObjectByName("phase["+i+"]").size = "8 16+"+offset+" 100% 100%";

		// Set phase icon
		let phaseIcon = Engine.GetGUIObjectByName("phase["+i+"]_phase");
		phaseIcon.sprite = "stretched:session/portraits/"+g_ParsedData.phases[pha].icon;
		phaseIcon.size = "16 32+"+offset+" 48+16 48+32+"+offset;

		// Position prod bars
		let j = 1;
		for (; j < phaseCount - i; ++j)
		{
			let prodBar = Engine.GetGUIObjectByName("phase["+i+"]_bar["+(j-1)+"]");
			prodBar.size = "40 90+"+ ((initIconSize.adjHeight+2)*j+offset+1) +" 100%-8 90+"+ ((initIconSize.adjHeight+2)*(j+1)+offset-1);
			
			// Set phase icon
			let prodBarIcon = Engine.GetGUIObjectByName("phase["+i+"]_bar["+(j-1)+"]_icon");
			prodBarIcon.sprite = "stretched:session/portraits/"+g_ParsedData.phases[phaseList[i+j]].icon;
			prodBarIcon.size = "4 "+initIconSize.vMargin+" 4+"+initIconSize.width+" "+(initIconSize.height+initIconSize.vMargin);
		}
		// Hide remaining prod bars
		hideRemaining("phase["+i+"]_bar[", j-1, "]");

		let s = 0;
		let ele = Engine.GetGUIObjectByName("phase["+i+"]_struct["+s+"]");
		g_DrawLimits[pha] = {
			structQuant: 0,
			prodQuant: []
		};

		do
		{
			// Position production icons
			for (let r in phaseList.slice(phaseList.indexOf(pha)))
			{
				let p = horizSpaceRepeatedObjects("phase["+i+"]_struct["+s+"]_row["+r+"]_prod[p]", "p", initIconSize.hMargin);

				// Set quantity of productions in this row
				g_DrawLimits[pha].prodQuant[r] = p;

				// Position the prod row
				Engine.GetGUIObjectByName("phase["+i+"]_struct["+s+"]_row["+r+"]").size = "4 100%-"+(initIconSize.adjHeight+2)*(phaseCount - i - r)+"-1 100%-4 100%";
			}

			// Hide unused struct rows
			for (let j = phaseCount - i; j < phaseCount; ++j)
				Engine.GetGUIObjectByName("phase["+i+"]_struct["+s+"]_row["+j+"]").hidden = true;

			let size = ele.size;
			size.bottom += Object.keys(g_DrawLimits[pha].prodQuant).length*(initIconSize.adjHeight+2);
			ele.size = size;

			s++;
			ele = Engine.GetGUIObjectByName("phase["+i+"]_struct["+s+"]");
		} while (ele !== undefined);

		// Set quantity of structures in each phase
		g_DrawLimits[pha].structQuant = s;
		++i;
	}
	hideRemaining("phase[", i, "]");
	hideRemaining("phase[", i, "]_bar");
	
	var t = 0;
	var ele = Engine.GetGUIObjectByName("trainer["+t+"]");
	g_DrawLimits.trainer = {
		trainerQuant: 0,
		prodQuant: 0
	};

	do
	{
		let p = horizSpaceRepeatedObjects("trainer["+t+"]_prod[p]", "p", initIconSize.hMargin);
		g_DrawLimits.trainer.prodQuant = p;
		Engine.GetGUIObjectByName("trainer["+t+"]_row").size = "4 100%-"+(initIconSize.adjHeight+2)+"-1 100%-4 100%";
		
		let size = ele.size;
		size.bottom += initIconSize.adjHeight+2;
		ele.size = size;
		
		t++;
		ele = Engine.GetGUIObjectByName("trainer["+t+"]");
		
	} while (ele !== undefined);
	
	var icon_offset = -Engine.GetGUIObjectByName("trainer[0]_icon").size.top;
	vertiSpaceRepeatedObjects("trainer[t]", "t", initIconSize.hMargin*4 + icon_offset);

	g_DrawLimits.trainer.trainerQuant = t;
}

/**
 * Assemble a tooltip text
 *
 * @param  template Information about a Unit, a Structure or a Technology
 *
 * @return  The tooltip text, formatted.
 */
function assembleTooltip(template)
{
	var txt = getEntityNamesFormatted(template);
	txt += "\n" + getEntityCostTooltip(template, 1);

	if (template.tooltip)
		txt += "\n" + txtFormats.body[0] +  translate(template.tooltip) + txtFormats.body[1];

	if (template.auras)
		txt += getAurasTooltip(template);

	if (template.health)
		txt += "\n" + sprintf(translate("%(label)s %(details)s"), {
			label: txtFormats.header[0] + translate("Health:") + txtFormats.header[1],
			details: template.health
		});

	if (template.healer)
		txt += "\n" + getHealerTooltip(template);

	if (template.attack)
		txt += "\n" + getAttackTooltip(template);

	if (template.armour)
		txt += "\n" + getArmorTooltip(template.armour);

	txt += "\n" + getSpeedTooltip(template);

	if (template.gather)
	{
		var rates = [];
		for (let type in template.gather)
			rates.push(sprintf(translate("%(resourceIcon)s %(rate)s"), {
				resourceIcon: getCostComponentDisplayName(type),
				rate: template.gather[type]
			}));

		txt += "\n" + sprintf(translate("%(label)s %(details)s"), {
			label: txtFormats.header[0] + translate("Gather Rates:") + txtFormats.header[1],
			details: rates.join("  ")
		});
	}

	return txt;
}
