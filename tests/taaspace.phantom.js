/*jshint expr: true*/ // prevent error in ...be.a.Function

describe('taaspace', function () {

  function getEmptyContainer() {
    // Return an empty html container.
    var cont = document.getElementById('taaspace-sandbox');
    cont.innerHTML = '';
    return cont;
  }

  it('should have submodules', function () {
    taaspace.should.have.keys('SpacePoint', 'Transform', 'SpaceTransform',
      'Taa', 'SpaceTaa', 'Space', 'HTMLSpaceView', 'version', 'SpaceHTML',
      'SpacePixel');
  });

  describe('Taa', function () {
    it('should fire "loaded" event', function (done) {
      var taa = new taaspace.Taa('assets/taa.png');
      taa.on('loaded', function (err, taa2) {
        should.equal(err, null);
        taa2.image.should.equal(taa.image);
        done();
      });
    });

    it('should result in error if file not found', function (done) {
      var taa = new taaspace.Taa('imnotreal.png', function (err, taa2) {
        should.not.equal(err, null);
        should.equal(taa2, null);
        done();
      });
    });
  });

  describe('HTMLSpaceView', function () {
    var space;
    var view;

    beforeEach(function () {
      var cont = getEmptyContainer();
      space = new taaspace.Space();
      view = new taaspace.HTMLSpaceView(space, cont);
    });

    // Easier to debug
    afterEach(function () {
      if (this.currentTest.state === 'failed') {
        takeScreenshot();
      }
    });

    it('should be able to create an img element immediately', function () {
      // Without need to wait for the image to load
      var taa = new taaspace.Taa('assets/taa.png');
      var spacetaa = new taaspace.SpaceTaa(space, taa);
      var el = $('img.taaspace-taa');
      el.should.exist;
      var st2 = view.getSpaceNodeByElementId(el.attr('id'));
      st2.should.equal(spacetaa);
    });

    it('should position the taa correctly', function (done) {
      var taa = new taaspace.Taa('assets/taa.png');
      var spacetaa = new taaspace.SpaceTaa(space, taa);
      spacetaa.at([0,0]).to(view).xy.should.eql([0,0]);
      spacetaa.atNorm([0.5,0.5]).to(view).xy.should.eql([128,128]);
      spacetaa.atNorm([1,1]).xy.should.eql([256,256]);
      spacetaa.translate(spacetaa.at([0,0]), view.at([256,256]));
      setTimeout(function () {
        spacetaa.atNorm([1,1]).to(view).xy.should.eql([512,512]);
        done();
      }, 200);
    });

    it('should be able to translate', function () {
      var taa = new taaspace.Taa('assets/taa.png');
      var spacetaa = new taaspace.SpaceTaa(space, taa);
      spacetaa.translate(spacetaa.atNorm([0,0]), spacetaa.atNorm([1,1]));
      var el1 = document.elementFromPoint(300, 300); // null if outside window
      var el2 = $('img.taaspace-taa')[0];
      el1.should.equal(el2);
    });

    it('should be able to present reparented taas', function () {
      var taa = new taaspace.Taa('assets/taa.png');
      var spacetaa = new taaspace.SpaceTaa(space, taa);
      spacetaa.translate(spacetaa.atNW(), spacetaa.atSE());
      spacetaa.setParent(view);
      // Let's see if spacetaa is still in place.
      var el1 = document.elementFromPoint(300, 300); // null if outside window
      el1.should.equal(view.getElementBySpaceNode(spacetaa));
      // Let's see if spacetaa follows the view.
      view.translate(space.at([0,0]), space.at([1000,1000]));
      var el2 = document.elementFromPoint(300, 300); // null if outside window
      el2.should.equal(el1);
    });

    it('should remove removed node', function () {
      // Create SpaceNode
      var node = new taaspace.SpaceHTML(space, 'foo');
      node.resize([100,100]);
      // Test if representation is removed.
      var el1 = document.elementFromPoint(50, 50);
      node.remove();
      var el2 = document.elementFromPoint(50, 50);
      el1.should.not.equal(el2);
      el2.id.should.equal('taaspace-sandbox');
    });

    it('should remove node reparented to another space', function () {
      var space2 = new taaspace.Space();
      var node = new taaspace.SpaceHTML(space, 'foo');
      node.resize([100, 100]);
      // Test if representation is removed.
      var el1 = document.elementFromPoint(50, 50);
      node.setParent(space2);
      var el2 = document.elementFromPoint(50, 50);
      el1.should.not.equal(el2);
      el2.id.should.equal('taaspace-sandbox');
    });

    it('should not become child of non-Space', function () {
      var node = new taaspace.SpaceHTML(space, 'foo');
      (function () {
        view.setParent(node);
      }).should.throw(/child/);
    });

    it('should be able to switch space', function () {
      // Setup:
      //   Another space with one child node C.
      //   C has a child D that is located next to C.
      var node = new taaspace.SpaceHTML(space, 'foo');
      node.resize([100, 100]);
      var space2 = new taaspace.Space();
      var node2 = new taaspace.SpaceHTML(space2, 'bar');
      node2.resize([100, 100]);
      var node3 = new taaspace.SpaceHTML(node2, 'baz');
      node3.resize([100, 100]);
      node3.translate(node3.atNW(), node2.atSE());
      // Test the setup
      var el = document.elementFromPoint(50, 50);
      view.getSpaceNodeByElementId(el.id).should.equal(node);
      // Reparent
      view.setParent(space2);
      // Test that view content has changed.
      el = document.elementFromPoint(50, 50);
      el.should.equal(view.getElementBySpaceNode(node2));
      el = document.elementFromPoint(150, 150);
      el.should.equal(view.getElementBySpaceNode(node3));
      should.equal(view.getElementBySpaceNode(node), null);
    });
  });

  describe('SpaceTaa', function () {
    var space, view, taa;

    beforeEach(function (done) {
      var cont = getEmptyContainer();
      space = new taaspace.Space();
      view = new taaspace.HTMLSpaceView(space, cont);
      taa = new taaspace.Taa('assets/taa.png', done);
    });

    it('should have an id', function () {
      var a = new taaspace.SpaceTaa(space, taa);
      var b = new taaspace.SpaceTaa(space, taa);
      a.should.have.property('id');
      a.id.should.be.a.String;
      b.id.should.be.a.String;
      a.id.should.not.equal(b.id);
    });

    it('should be removable', function () {
      var a = new taaspace.SpaceTaa(space, taa);
      a.remove();
      space._children.hasOwnProperty(a.id).should.equal(false);
    });

    it('should be able to return a SpacePoint', function () {
      var a = new taaspace.SpaceTaa(space, taa);
      var p = a.atNorm([1,1]);
      var vp = p.to(view);
      var epsilon = 0.01;
      var val = 256;
      vp.xy[0].should.be.within(val - epsilon, val + epsilon);
      vp.xy[1].should.be.within(val - epsilon, val + epsilon);
    });

    it('should be able to give and take Transform objects', function () {
      var a = new taaspace.SpaceTaa(space, taa);
      // Move to unit square.
      a.translateScale(
        [a.atNW(), a.atSE()],
        [space.at([0,0]), space.at([1,1])]
      );
      var t = a.getTransform();
      var rt = t.rotateBy(1);
      a.setTransform(rt);
      a.atSE().to(space).xy.should.not.eql([1,1]);
      a.setTransform(t);
      a.atSE().to(space).xy.should.eql([1,1]);
    });

    it('should allow children', function () {
      var a = new taaspace.SpaceTaa(space, taa);
      var b = new taaspace.SpaceTaa(a, taa);
      var c = new taaspace.SpaceTaa(b, taa);
      a.getChildren().should.eql([b]);
      a.getDescendants()[0].should.equal(b);
      a.getDescendants()[1].should.equal(c);
      c.getDescendants().should.eql([]);
    });
  });

  describe('SpaceTransformer', function () {
    var space;

    beforeEach(function () {
      space = new taaspace.Space();
    });

    describe('#applySpaceTransform', function () {
      it('should take a identity SpaceTransform', function () {
        var a = new taaspace.SpacePixel(space);
        var t = new taaspace.SpaceTransform(space);
        a.applySpaceTransform(t);
        a.atSE().xy.should.eql([1,1]);
      });

      it('should take a simple translation', function () {
        var a = new taaspace.SpacePixel(space);
        var t = new taaspace.SpaceTransform(space);
        t = t.translate(space.at([0,0]), space.at([1,1]));
        a.atSE().xy.should.eql([1,1]);
        a.applySpaceTransform(t);
        a.atSE().to(space).xy.should.eql([2,2]);
        a.applySpaceTransform(t);
        a.atSE().to(space).xy.should.eql([3,3]);
      });
    });

  });

  describe('SpaceHTML', function () {
    var space, view, taa;

    beforeEach(function () {
      var cont = getEmptyContainer();
      space = new taaspace.Space();
      view = new taaspace.HTMLSpaceView(space, cont);
    });

    // Easier to debug
    afterEach(function () {
      if (this.currentTest.state === 'failed') {
        takeScreenshot();
      }
    });

    it('should allow creation', function () {
      var a = new taaspace.SpaceHTML(space, '<h1>Hello</h1>');
      var el = $('.taaspace-html');
      var h1 = el.find('h1');
      h1.should.exist;
      var b = view.getSpaceNodeByElementId(el.attr('id'));
      b.should.equal(a);
    });

    it('should be resizable', function () {
      var a, a0, a1;
      a = new taaspace.SpaceHTML(space, '<h1>Hello</h1>');
      a.resize([100, 100]);
      a0 = document.elementFromPoint(150, 150);
      a0.should.equal(view.getRootElement());
      a.resize([200, 200]);
      a1 = document.elementFromPoint(150, 150);
      a1.should.equal(view.getElementBySpaceNode(a));
    });
  });

  describe('SpacePoint', function () {
    describe('#polarOffset', function () {
      var space, p;

      beforeEach(function () {
        space = new taaspace.Space();
        p = space.at([100, 100]);
      });

      it('should allow 0 and 2PI', function () {
        var a = p.polarOffset(100, 2 * Math.PI);
        var b = p.polarOffset(100, 0);
        a.xy.should.be.shallowDeepAlmostEqual(b.xy);
      });

      it('should allow 0 distance', function () {
        var a = p.polarOffset(0, Math.PI / 3);
        a.xy.should.eql(p.xy);
      });

      it('should allow angles outside [0, 2PI]', function () {
        var a = p.polarOffset(100, 2 * Math.PI + 1);
        var b = p.polarOffset(100, 1);
        a.xy.should.be.shallowDeepAlmostEqual(b.xy);
      });
    });
  });

  describe('SpaceTransform', function () {

    describe('#equals', function () {
      it('should detect small difference', function () {
        var s = new taaspace.Space();
        var t1 = new taaspace.Transform(1.0, 2.0, 3.0, 4.0);
        var t2 = new taaspace.Transform(1.0, 2.0, 3.0, 4.01);
        var st1 = new taaspace.SpaceTransform(s, t1);
        var st2 = new taaspace.SpaceTransform(s, t2);
        st1.equals(st2).should.be.True;
      });
    });

    describe('#to', function () {
      var space;

      beforeEach(function () {
        space = new taaspace.Space();
      });

      it('should convert simple translation', function () {
        var txt = new taaspace.SpaceHTML(space, '');
        txt.scale(space.at([0,0]), 2.0);
        // On txt, 1 unit is 2 space units.
        var t = taaspace.Transform.IDENTITY.translateBy(1, 1);
        var st = new taaspace.SpaceTransform(txt, t);
        // Convert +1,+1 translation to space.
        var stOnSpace = st.to(space);
        stOnSpace.T.transform([1,1]).should.eql([3,3]);
      });
    });

  });

});
