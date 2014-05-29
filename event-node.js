(function(){

  var SyntheticEvent = (function(){
    
    var eventUid = (function() {
      var counter = 0;
      return function() {
        return ++counter;
      };
    }());

    var delimiter = "/";

    function SyntheticEvent( opt ){
      this.type = opt.type;
      this.originNode = opt.origin;
      this.currentNode = opt.origin;
      this.id = eventUid();
      this.timestamp = Date.now();
      this.isPropagationStopped = false;
      this.isImmediatePropagationStopped = false;
    }

    SyntheticEvent.setDelimiter = function( d ) {
      delimiter = d;
    };

    SyntheticEvent.prototype.stopPropagation = function() {
      this.isPropagationStopped = true;
    };

    SyntheticEvent.prototype.stopImmediatePropagation = function() {
      this.isImmediatePropagationStopped = true;
      this.isPropagationStopped = true;
    }

    return SyntheticEvent;
  }());

  var EventNode = (function(){

    function EventNode( name ) {
      if ( name ) this.name = name;
      this.children = [];
      this._names = [];
    }

    EventNode.prototype = Object.create( EventEmitter.prototype );

    var trigger = EventEmitter.prototype.trigger;

    EventNode.prototype.addChild = function( name ) {
      if ( this._names.indexOf( name ) > -1 ) {
        throw new Error( "This node already has a child named" + name + "." );
        return null;
      }
      child = new EventNode();
      child.parent = this;
      child.name = name;
      this.children.push( child );
      return child;
    };

    EventNode.prototype.removeChild = function( idxOrName ) {
      var child,
          index,
          exists;
      if ( isNaN( idxOrName ) ) {
        exists = this.children.some( function( item, i ) {
          index = i;
          return item.name === idxOrName;
        });
        if ( !exists ) return null;
      } else { 
        index = idxOrName;
      }
      return this.children.splice( index, 1 )[0];
    };

    EventNode.prototype.get = function( idxOrName ) {
      if ( isNaN( idxOrName ) ) {
        return this.children.filter( function( child ) {
          return child.name === idxOrName;
        })[0];
      } else {
        return this.children[idxOrName];
      }
    };

    EventNode.prototype.nextSibling = function(){
      var parent = this.parent;
      if ( parent ) {
        len = parent.children.length;
        i = parent.children.indexOf( this );
        if ( i > -1 && i < len - 1 ) {
          return parent.children[i + 1];
        }
      }
      return null;
    };

    EventNode.prototype.prevSibling = function(){
      var parent = this.parent;
      if ( parent ) {
        len = parent.children.length;
        i = parent.children.indexOf( this );
        if ( i > 0 ) {
          return parent.children[i - 1];
        }
      }
      return null;
    };

    EventNode.prototype.emit = function( type, eventIn ) {
      var eventOut;
      var args;

      // Event is bubbling through node.
      if ( eventIn && eventIn instanceof SyntheticEvent ) {
        // return out early if true
        if ( eventIn.isImmediatePropagationStopped ) {
          return false;
        }
        eventOut = this.updateEvent( eventIn );
        args = [].slice.call( arguments, 2 );

      // Event is originating at node.
      } else {
        eventOut = this.originateEvent( type );
        args = [].slice.call( arguments, 1 );
      }

      // Event object will always be first argument that the handler ultimately receives
      args.unshift( eventOut );

      // But the node needs to listen for the event TYPE.
      args.unshift( eventOut.type );

      // Emit the event on this node with our constructed args
      EventEmitter.prototype.emit.apply( this, args );

      // Bubble the event up.
      if ( this.parent && !eventOut.isPropagationStopped ) {
        this.emit.apply( this.parent, args );
      }

      return this;
    };

    EventNode.prototype.isRoot = function() {
      return !!this.parent;
    };

    EventNode.prototype.originateEvent = function( type, args ) {
      return new SyntheticEvent({
        origin: this,
        type: type,
      });
    };

    EventNode.prototype.updateEvent = function( evt ) {
      evt.currentNode = this;
      return evt;
    };

    EventNode.prototype.type = function() {
      if ( !this.parent ) {
        return "root";
      } else if ( this.children.length ) {
        return "branch";
      } else {
        return "leaf";
      }
    };

    return EventNode;
  }());


  if ( typeof define === 'function' && define.amd ) {
    define( function () {
      return EventNode;
    });
  }
  else if ( typeof module === 'object' && module.exports ) {
    module.exports = EventNode;
  }
  else {
    this.EventNode = EventNode;
  }

}());