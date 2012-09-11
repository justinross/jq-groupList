/*
* Dependencies: jQuery 1.7, Kinetic plug-in
*/

(function( $ ){

	var methods = {
		init : function(options) {
			return this.each(function(){
				//Should this be outside?
				var defaults = {
					indexOn: false, //Whether to use the alphabetical index or not. Default: false
					subTitleOn: false //Whether to include a subtitle on each button or not. Default: false
				};
				var $this = $(this), $listBox = $(this);
				options = $.extend(defaults, options);
				$this.data('groupListOpts',options);
				$this.data('groupListBackup', $this.html());
				$this.addClass("groupListWrapperOuter");
				$this.wrapInner('<div class="groupListScroller"/>');
				$('div.groupListScroller', $this).kinetic();
				//Build the sections
				var $sections = $this.find("ul").not(".groupListIndex");
				$sections.each(function(id){
					var $this = $(this);
					var $listButtons = $this.children();
					var listName = $this.attr('data-listname');
					$listButtons.addClass('groupListItem');
					if(options.subTitleOn === false){$listButtons.addClass("noSubtitle");}
					var wrapper = '<div class="groupListButtonTitle"/>';
					$listButtons.wrapInner(wrapper);
					$listButtons.each(function(){
						var $this = $(this);
						$this.append('<div class="groupListButtonSubinfo"><b>'+ $this.attr('data-buttonSub') + '</b></div>');
						$this.append('<b class="groupListButtonPlaceholder">&nbsp;</b>');
					});
					$this.prepend("<li class='groupListHeader'><b>" + listName + "</b></li>");
					//add bottom spacing, to clean up the last section:
					if(id + 1 == $sections.length && $sections.length > 1){
						//height of the total box, minus the height of the current box.
						var totalHeight = $listBox.innerHeight();
						var thisHeight = $this.outerHeight();
						$this.css({'margin-bottom':totalHeight - thisHeight});
					}
				});
				changeHeader($sections.first());
				if(options.indexOn === true){addIndex($this);}
				$('div.groupListScroller', $this).scroll(function(event){
					headerProcessing(event);
				});
			});
		},
		remove : function(self) {
			return self.each(function(){
				var $this = $(this);
				$this.empty();
				$this.removeClass('groupListWrapper');
				$this.html($this.data('groupListBackup'));
				$this.removeData('groupList');
				$this.removeData('groupListBackup');
			});
		},
		getOptions : function() {
			var $this = $(this);
			var currentOptions = $this.data('groupListOpts');
			return currentOptions;
		}
	};

	function addIndex($object){
		var letter = "A";
		i = 0;
		var letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
		letters = letters.split("");
		$object.parent('.groupListWrapper').wrap('<div class="groupListIndexWrapper"/>');
		$object.parent().parent().append('<nav class="groupListIndex"></nav>');
		$index = $('nav.groupListIndex',$object.parent().parent());
		$object = $("#"+$object['0'].id);
		for(var id in letters) {
			letter = letters[id];
			var $relevantUL = $object.children("[data-listname="+letter+"]");
			$index.append("<b class='groupListIndexLetter' data-letter='"+letter+"'>" + letter + "</b>");
			$object = $("#"+$object['0'].id);
			if($relevantUL.position() === null){
				$disabled = $object.parent().parent().find("[data-letter="+letter+"]");
				$disabled.css({'opacity':'0.25'});
			}
		}
		$updated = $("#"+$object[0].id);
		$listContext = $object.parent().parent();
		$('.groupListIndexLetter', $listContext).fontPercent(3.7);
		//Bind a mousedown to the index container
		$('nav.groupListIndex b.groupListIndexLetter', $listContext).mousedown(function(){
			//When the user clicks/taps anywhere on the index container, bind a mouseover function to each letter
			scrollToSelected($(this),$object);
			$('nav.groupListIndex b.groupListIndexLetter', $listContext).mouseenter(function(){
				scrollToSelected($(this),$object);
			});
			return false;
		});
		$("html").mouseup(function(){
			$('nav.groupListIndex b.groupListIndexLetter', $listContext).unbind('mouseenter');
		});
	}

	function scrollToSelected($clickedIndexItem,$scrolledContainer){
		//See which letter was moused over
		var indexLetter = $clickedIndexItem.attr('data-letter');
		var $relevantUL = $scrolledContainer.children("[data-listname="+indexLetter+"]");
		if($relevantUL.position() !== null){
			newScrollTop = $scrolledContainer.scrollTop() + $relevantUL.position().top + 3;
		}
		$scrolledContainer.clearQueue();
		$scrolledContainer.animate({scrollTop: newScrollTop},100,'swing',function(){
			checkHeader($scrolledContainer);
		});
	}


	function headerProcessing($scrollingEvent){
		$this = $($scrollingEvent.target);
		//$this = $this.find('.groupList');
		checkHeader($this);
	}

	function checkHeader($el){
		//Check the very first UL, and the ones adjacent to .active (and maybe .active?).
		/*$activeAdjacent = $this.children().filter(function(id){
			if(id === 0 || $(this).prev().hasClass('active') || $(this).next().hasClass('active')){return false;}
			else{return false;}
		});
		*/

		var $this = $el;
		var $siblings = $this.children();
		var nudging = 0;
		var count = 0;
		
		$siblings.each(function(index, value){
			//If the UL's top value is < 0, and the bottom (top + outerHeight) is > 0, it's the topmost UL, and should be active. Run changeHeader(currentUL).
			var $this = $(this);
			var top = $this.position().top, bottom = top + $this.outerHeight(), activeHeaderHeight = $('.active',$this.parent()).children('.groupListHeader').outerHeight();
			if(top < 0 && bottom > 0 - 11 && !$this.hasClass('active') && !$this.is(":last")){
				changeHeader($this);
			}
			//If the UL's top value is < 0 + the height of the active header, it's pushing on the active header. Find out how much and run nudgeHeader(amount).
			if(top < 0 + activeHeaderHeight && bottom > 0 && !$this.hasClass('active')){
				nudgeHeader($this,activeHeaderHeight - top);
				nudging = 1;
			}
		});
		if(nudging === 0){
			nudgeHeader($this,0);
		}
		
	}

	function changeHeader($newHeaderSection){
		/*
		To change the header:
		*/
		$active = $('.active',$newHeaderSection.parent());
		//Remove any extra padding from .active.
		$active.css({'padding-top':''});
		$active.children('.groupListHeader').css({'top':''});
			
		//Remove the class .active from the current .active object.
		$active.removeClass('active');
			
		//Add .active to $newHeader
		$newHeaderSection.addClass("active");

		//Add padding-top equal to the height of .active's header
		newHeaderHeight = $newHeaderSection.find('.groupListHeader').outerHeight();
		$newHeaderSection.css({'padding-top':newHeaderHeight});
		//return something. Maybe.
	}

	function nudgeHeader($object, nudgeAmount){
		/*
		To nudge the current header:
		Take nudgeAmount (which will be a negative number, probably. Maybe.) and add it to the "top" value of the current (.active) header.
		*/
		//$object is any section in the groupList.
		var $currentActive = $object.parent().find('.active');
		$currentActive.children('.groupListHeader').css({'top':-nudgeAmount});
	}


$.fn.groupList = function(methodOrOptions) {
	if ( methods[methodOrOptions] ) {
		return methods[ methodOrOptions ].apply( this, Array.prototype.slice.call( arguments, 1 ));
    } 
    else if ( typeof methodOrOptions === 'object' || ! methodOrOptions ) {
		return methods.init.apply( this, arguments );
    } 
    else {
		$.error( 'Method ' +  methodOrOptions + ' does not exist on jQuery.tooltip' );
    }    

  };
})( jQuery );